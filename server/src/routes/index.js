import { Router } from 'express';
import { optionalAuth, requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { authLimiter, writeLimiter, viewLimiter } from '../middleware/rateLimit.js';
import { imageUpload } from '../middleware/upload.js';
import * as S from '../validators/schemas.js';
import * as auth from '../controllers/authController.js';
import * as articles from '../controllers/articleController.js';
import * as comments from '../controllers/commentController.js';
import * as taxonomy from '../controllers/taxonomyController.js';
import * as searchCtl from '../controllers/searchController.js';
import * as users from '../controllers/userController.js';
import * as polls from '../controllers/pollController.js';
import * as players from '../controllers/playerController.js';
import * as admin from '../controllers/adminController.js';
import * as misc from '../controllers/miscController.js';
import { publishDueArticles } from '../services/scheduler.js';

const router = Router();
const editor = requireRole('EDITOR');
const adminOnly = requireRole('ADMIN');

router.use(optionalAuth);

router.get('/health', (_req, res) => res.json({ success: true, data: { status: 'ok', time: new Date() } }));

/* Vercel Cron backup for scheduled publishing. Vercel sends "Authorization: Bearer $CRON_SECRET". */
router.get('/cron/publish-scheduled', async (req, res, next) => {
  try {
    const secret = process.env.CRON_SECRET;
    if (!secret || req.get('authorization') !== `Bearer ${secret}`) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized.', code: 'UNAUTHORIZED' } });
    }
    res.json({ success: true, data: { published: await publishDueArticles() } });
  } catch (err) {
    next(err);
  }
});

/* ---------- auth ---------- */
router.post('/auth/register', authLimiter, validate(S.registerSchema), auth.register);
router.post('/auth/login', authLimiter, validate(S.loginSchema), auth.login);
router.post('/auth/logout', auth.logout);
router.get('/auth/me', auth.me);

/* ---------- articles ---------- */
router.get('/articles', articles.listArticles);
router.get('/articles/featured', articles.featuredArticles);
router.get('/articles/trending', articles.trendingArticles);
router.get('/articles/:slug', articles.getArticle);
router.post('/articles', editor, validate(S.articleCreateSchema), articles.createArticle);
router.patch('/articles/:id', editor, validate(S.articleUpdateSchema), articles.updateArticle);
router.delete('/articles/:id', editor, articles.deleteArticle);
router.post('/articles/:id/view', viewLimiter, articles.recordView);
router.get('/articles/:id/related', articles.relatedArticles);
router.post('/articles/:id/like', requireAuth, writeLimiter, articles.toggleLike);
router.post('/articles/:id/bookmark', requireAuth, writeLimiter, articles.toggleBookmark);
router.get('/articles/:id/comments', comments.listComments);
router.post('/articles/:id/comments', requireAuth, writeLimiter, validate(S.commentSchema), comments.createComment);

/* ---------- comments ---------- */
router.post('/comments/:id/replies', requireAuth, writeLimiter, validate(S.commentSchema), comments.createReply);
router.delete('/comments/:id', requireAuth, comments.deleteComment);
router.post('/comments/:id/report', requireAuth, writeLimiter, validate(S.reportSchema), comments.reportComment);

/* ---------- taxonomy & search ---------- */
router.get('/categories', taxonomy.listCategories);
router.get('/categories/:slug', taxonomy.getCategory);
router.post('/categories', adminOnly, validate(S.categorySchema), taxonomy.createCategory);
router.patch('/categories/:id', adminOnly, validate(S.categorySchema.partial()), taxonomy.updateCategory);
router.delete('/categories/:id', adminOnly, taxonomy.deleteCategory);

router.get('/tags', taxonomy.listTags);
router.post('/tags', adminOnly, validate(S.tagSchema), taxonomy.createTag);
router.patch('/tags/:id', adminOnly, validate(S.tagSchema), taxonomy.updateTag);
router.delete('/tags/:id', adminOnly, taxonomy.deleteTag);

router.get('/search', searchCtl.search);

/* ---------- users ---------- */
router.patch('/users/me', requireAuth, validate(S.updateMeSchema), users.updateMe);
router.get('/users/me/bookmarks', requireAuth, users.myBookmarks);
router.patch('/users/me/bookmarks/:articleId', requireAuth, validate(S.bookmarkListSchema), users.moveBookmark);
router.get('/users/:username', users.getProfile);

/* ---------- polls ---------- */
router.get('/polls', polls.listPolls);
router.get('/polls/:id', polls.getPoll);
router.post('/polls/:id/vote', requireAuth, writeLimiter, validate(S.voteSchema), polls.vote);
router.post('/polls', adminOnly, validate(S.pollSchema), polls.createPoll);
router.patch('/polls/:id', adminOnly, validate(S.pollUpdateSchema), polls.updatePoll);
router.delete('/polls/:id', adminOnly, polls.deletePoll);

/* ---------- players ---------- */
router.get('/players', players.listPlayers);
router.get('/players/:slug', players.getPlayer);
router.post('/players/:id/rate', requireAuth, writeLimiter, validate(S.rateSchema), players.ratePlayer);
router.post('/players', adminOnly, validate(S.playerSchema), players.createPlayer);
router.patch('/players/:id', adminOnly, validate(S.playerUpdateSchema), players.updatePlayer);
router.delete('/players/:id', adminOnly, players.deletePlayer);

/* ---------- newsletter & uploads ---------- */
router.post('/newsletter', writeLimiter, validate(S.newsletterSchema), misc.subscribe);
router.get('/uploads/status', editor, misc.uploadStatus);
router.post('/uploads', editor, imageUpload(6), misc.uploadImage('articles'));
router.post('/uploads/avatar', requireAuth, writeLimiter, imageUpload(2), misc.uploadImage('avatars'));

/* ---------- admin / editorial dashboard ---------- */
router.get('/admin/analytics', editor, admin.analytics);
router.get('/admin/articles', editor, admin.adminListArticles);
router.get('/admin/articles/:id', editor, admin.adminGetArticle);
router.patch('/admin/articles/:id/featured', adminOnly, admin.setFeatured);
router.get('/admin/players/:id', adminOnly, players.getPlayerById);
router.get('/admin/users', adminOnly, admin.listUsers);
router.patch('/admin/users/:id/role', adminOnly, validate(S.roleSchema), admin.setUserRole);
router.get('/admin/comments', adminOnly, admin.listCommentsForModeration);
router.patch('/admin/comments/:id', adminOnly, validate(S.commentModerationSchema), admin.moderateComment);
router.get('/admin/subscribers', adminOnly, admin.listSubscribers);

export default router;
