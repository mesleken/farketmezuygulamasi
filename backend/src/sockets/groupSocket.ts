import { Server, Socket } from 'socket.io';
import { db } from '../db/store.js';
import { GroupMatchingEngine } from '../engine/groupMatchingEngine.js';
import { v4 as uuidv4 } from 'uuid';

export function setupGroupSocket(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Join a group room
    socket.on('join-room', ({ roomCode, userId }: { roomCode: string; userId: string }) => {
      try {
        if (!roomCode || typeof roomCode !== 'string' || !userId) {
          socket.emit('error-msg', 'Geçersiz oda kodu veya kullanıcı kimliği');
          return;
        }

        const session = db.getGroupSession(roomCode.trim());
        if (!session) {
          socket.emit('error-msg', 'Grup oturumu bulunamadı');
          return;
        }

        const user = db.getUser(userId);
        if (user) {
          const exists = session.members.some(m => m.userId === userId);
          if (!exists) {
            session.members.push({
              userId: user.id,
              name: user.name,
              avatar: user.avatar,
              joinedAt: new Date().toISOString(),
              recentFairnessScore: db.getUserAverageFairness(user.id)
            });
            db.saveGroupSession(session);
          }
        }

        socket.join(session.code.toUpperCase());
        io.to(session.code.toUpperCase()).emit('room-updated', session);
      } catch (error) {
        console.error('Socket join-room error:', error);
        socket.emit('error-msg', 'Odaya katılırken bir hata oluştu');
      }
    });

    // Leave a group room
    socket.on('leave-room', ({ roomCode, userId }: { roomCode: string; userId: string }) => {
      try {
        if (!roomCode) return;
        const session = db.getGroupSession(roomCode.trim());
        if (session) {
          socket.leave(session.code.toUpperCase());
          console.log(`[Socket] User ${userId} left room ${session.code}`);
        }
      } catch (error) {
        console.error('Socket leave-room error:', error);
      }
    });

    // Start Group Calculation (Single Clear Recommendation + Fairness)
    socket.on('start-calculate', ({ roomCode }: { roomCode: string }) => {
      try {
        if (!roomCode || typeof roomCode !== 'string') return;
        const session = db.getGroupSession(roomCode.trim());
        if (!session) return;

        session.status = 'calculating';
        io.to(session.code.toUpperCase()).emit('room-updated', session);

        setTimeout(() => {
          try {
            const memberIds = session.members.map(m => m.userId);
            const result = GroupMatchingEngine.matchSingleForGroup({
              userIds: memberIds,
              itemType: session.itemType,
              targetBudget: session.targetBudget
            });

            session.status = 'voting';
            session.recommendation = result.recommendation || undefined;
            session.fairnessExplanation = result.fairnessExplanation;
            session.members.forEach(m => {
              delete m.vote;
            });

            db.saveGroupSession(session);
            io.to(session.code.toUpperCase()).emit('room-updated', session);
          } catch (error) {
            console.error('Socket matchSingleForGroup error:', error);
            socket.emit('error-msg', 'Hesaplama sırasında bir hata oluştu');
          }
        }, 1000);
      } catch (error) {
        console.error('Socket start-calculate error:', error);
      }
    });

    // Cast vote
    socket.on('cast-vote', ({ roomCode, userId, vote }: { roomCode: string; userId: string; vote: 'yes' | 'no' | 'neutral' }) => {
      try {
        if (!roomCode || !userId || !vote) return;
        const session = db.getGroupSession(roomCode.trim());
        if (!session) return;

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

            // Auto-log to history & fairness scores
            if (session.finalDecision) {
              for (const m of session.members) {
                db.addActivityLog({
                  id: `log-${uuidv4().slice(0, 8)}`,
                  userId: m.userId,
                  userName: m.name,
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
        }

        db.saveGroupSession(session);
        io.to(session.code.toUpperCase()).emit('room-updated', session);
      } catch (error) {
        console.error('Socket cast-vote error:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });
}
