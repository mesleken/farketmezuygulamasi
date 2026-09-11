import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/store.js';
import { GroupSession, ItemType, BudgetLevel } from '../types/index.js';
import { GroupMatchingEngine } from '../engine/groupMatchingEngine.js';

const router = Router();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// POST /api/groups
router.post('/groups', (req, res) => {
  try {
    const { creatorId = 'user-1', name = 'Akşam Planı Grubu', itemType = 'all', targetBudget } = req.body;
    const creator = db.getUser(creatorId);

    const newSession: GroupSession = {
      id: `grp-${uuidv4().slice(0, 8)}`,
      code: generateRoomCode(),
      creatorId,
      name,
      itemType: itemType as ItemType | 'all',
      targetBudget: targetBudget as BudgetLevel | undefined,
      status: 'lobby',
      rejectStreakCount: 0,
      members: [
        {
          userId: creatorId,
          name: creator?.name || 'Grup Kurucusu',
          avatar: creator?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=creator',
          joinedAt: new Date().toISOString(),
          recentFairnessScore: db.getUserAverageFairness(creatorId)
        }
      ],
      createdAt: new Date().toISOString()
    };

    db.saveGroupSession(newSession);
    res.status(201).json(newSession);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/groups/:idOrCode
router.get('/groups/:idOrCode', (req, res) => {
  try {
    const session = db.getGroupSession(req.params.idOrCode);
    if (!session) {
      return res.status(404).json({ error: 'Grup oturumu bulunamadı' });
    }
    res.json(session);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/groups/:idOrCode/join
router.post('/groups/:idOrCode/join', (req, res) => {
  try {
    const { userId } = req.body;
    const session = db.getGroupSession(req.params.idOrCode);
    if (!session) {
      return res.status(404).json({ error: 'Grup oturumu bulunamadı' });
    }

    const user = db.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    const alreadyJoined = session.members.some(m => m.userId === userId);
    if (!alreadyJoined) {
      session.members.push({
        userId: user.id,
        name: user.name,
        avatar: user.avatar,
        joinedAt: new Date().toISOString(),
        recentFairnessScore: db.getUserAverageFairness(user.id)
      });
      db.saveGroupSession(session);
    }

    res.json(session);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/groups/:idOrCode/calculate (Single Clear Recommendation + Fairness)
router.post('/groups/:idOrCode/calculate', (req, res) => {
  try {
    const session = db.getGroupSession(req.params.idOrCode);
    if (!session) {
      return res.status(404).json({ error: 'Grup oturumu bulunamadı' });
    }

    const memberIds = session.members.map(m => m.userId);
    const result = GroupMatchingEngine.matchSingleForGroup({
      userIds: memberIds,
      itemType: session.itemType,
      targetBudget: session.targetBudget
    });

    session.status = 'voting';
    session.recommendation = result.recommendation || undefined;
    session.fairnessExplanation = result.fairnessExplanation;

    // Reset votes
    session.members.forEach(m => {
      delete m.vote;
    });

    db.saveGroupSession(session);
    res.json(session);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/groups/:idOrCode/vote
router.post('/groups/:idOrCode/vote', (req, res) => {
  try {
    const { userId, vote } = req.body;
    const session = db.getGroupSession(req.params.idOrCode);
    if (!session) {
      return res.status(404).json({ error: 'Grup oturumu bulunamadı' });
    }

    const member = session.members.find(m => m.userId === userId);
    if (member) {
      member.vote = vote;
    }

    const allVoted = session.members.every(m => !!m.vote);
    if (allVoted) {
      const yesCount = session.members.filter(m => m.vote === 'yes').length;
      const neutralCount = session.members.filter(m => m.vote === 'neutral').length;

      if (yesCount + neutralCount >= Math.ceil(session.members.length / 2)) {
        session.status = 'decided';
        session.finalDecision = session.recommendation?.venue || null;

        // Record fairness scores
        if (session.recommendation?.breakdown.groupMemberScores) {
          for (const mScore of session.recommendation.breakdown.groupMemberScores) {
            db.recordGroupFairnessScore({
              userId: mScore.userId,
              groupId: session.id,
              satisfactionScore: mScore.score / 100,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    }

    db.saveGroupSession(session);
    res.json(session);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/groups/:idOrCode/start-voting (Generate Candidate Trio for Asynchronous Voting)
router.post('/groups/:idOrCode/start-voting', (req, res) => {
  try {
    const session = db.getGroupSession(req.params.idOrCode);
    if (!session) {
      return res.status(404).json({ error: 'Grup oturumu bulunamadı' });
    }

    const memberIds = session.members.map(m => m.userId);
    const candidates = GroupMatchingEngine.generateCandidateTrioForGroup({
      userIds: memberIds,
      itemType: session.itemType,
      targetBudget: session.targetBudget
    });

    session.status = 'voting';
    session.candidateVenues = candidates;
    session.votes = {};
    session.members.forEach(m => {
      delete m.vote;
    });

    db.saveGroupSession(session);
    res.json(session);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/groups/:idOrCode/submit-vote (Submit Approve / Veto list)
router.post('/groups/:idOrCode/submit-vote', (req, res) => {
  try {
    const { userId, approvedVenueIds = [], vetoedVenueIds = [] } = req.body;
    const session = db.getGroupSession(req.params.idOrCode);
    if (!session) {
      return res.status(404).json({ error: 'Grup oturumu bulunamadı' });
    }

    session.votes = session.votes || {};
    session.votes[userId] = {
      approvedVenueIds,
      vetoedVenueIds
    };

    const member = session.members.find(m => m.userId === userId);
    if (member) {
      member.vote = approvedVenueIds.length > 0 ? 'yes' : 'neutral';
    }

    db.saveGroupSession(session);
    res.json(session);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/groups/:idOrCode/finalize-vote (Calculate Consensus from Votes)
router.post('/groups/:idOrCode/finalize-vote', (req, res) => {
  try {
    const session = db.getGroupSession(req.params.idOrCode);
    if (!session) {
      return res.status(404).json({ error: 'Grup oturumu bulunamadı' });
    }

    if (!session.candidateVenues || session.candidateVenues.length === 0) {
      return res.status(400).json({ error: 'Oylanacak aday mekan bulunamadı' });
    }

    const tally = GroupMatchingEngine.tallyGroupVotes(session);
    session.status = 'decided';
    session.finalDecision = tally.winner;
    session.fairnessExplanation = tally.explanation;

    if (session.finalDecision) {
      for (const member of session.members) {
        db.addActivityLog({
          id: `log-${uuidv4().slice(0, 8)}`,
          userId: member.userId,
          userName: member.name,
          venueId: session.finalDecision.id,
          title: session.finalDecision.title,
          category: session.finalDecision.category,
          type: session.finalDecision.type,
          location: session.finalDecision.district,
          date: new Date().toISOString(),
          rating: 5,
          feedback: 'liked',
          groupId: session.id,
          cooldownDays: session.finalDecision.defaultCooldownDays
        });
      }
    }

    db.saveGroupSession(session);
    res.json(session);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
