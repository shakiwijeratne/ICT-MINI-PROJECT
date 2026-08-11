"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const https_1 = require("firebase-functions/v2/https");
(0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
const auth = (0, auth_1.getAuth)();
const app = (0, express_1.default)();
class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}
const asyncHandler = (handler) => (req, res, next) => {
    handler(req, res, next).catch(next);
};
app.use((0, cors_1.default)({ origin: true }));
app.use(express_1.default.json({ limit: '1mb' }));
app.use((req, _res, next) => {
    if (req.url === '/api')
        req.url = '/';
    if (req.url.startsWith('/api/'))
        req.url = req.url.slice(4);
    next();
});
function requireString(value, field) {
    if (typeof value !== 'string' || !value.trim()) {
        throw new HttpError(400, `${field} is required`);
    }
    return value.trim();
}
function optionalString(value) {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}
function requireNumber(value, field) {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        throw new HttpError(400, `${field} must be a number`);
    }
    return value;
}
function requireArray(value, field) {
    if (!Array.isArray(value)) {
        throw new HttpError(400, `${field} must be an array`);
    }
    return value.map((item) => String(item));
}
async function getUser(uid) {
    const snap = await db.collection('users').doc(uid).get();
    return snap.exists ? snap.data() : null;
}
async function authenticate(req, _res, next) {
    try {
        const header = req.header('authorization') ?? '';
        const match = header.match(/^Bearer (.+)$/i);
        if (!match)
            throw new HttpError(401, 'Authorization bearer token is required');
        const decoded = await auth.verifyIdToken(match[1]);
        const profile = await getUser(decoded.uid);
        if (!profile)
            throw new HttpError(403, 'User profile not found');
        req.tokenUid = decoded.uid;
        req.user = profile;
        next();
    }
    catch (error) {
        next(error);
    }
}
function requireRole(...roles) {
    return (req, _res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            next(new HttpError(403, 'Insufficient permissions'));
            return;
        }
        next();
    };
}
function canAccessStudent(req, studentId) {
    if (!req.user)
        return false;
    if (req.user.role === 'admin' || req.user.role === 'supervisor' || req.user.role === 'company')
        return true;
    return req.user.uid === studentId;
}
async function listCollection(collectionName, filters = {}) {
    let query = db.collection(collectionName);
    for (const [field, value] of Object.entries(filters)) {
        if (value)
            query = query.where(field, '==', value);
    }
    const snap = await query.get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
async function createDocument(collectionName, data) {
    const ref = await db.collection(collectionName).add(data);
    return { ...data, id: ref.id };
}
async function patchDocument(collectionName, id, data) {
    await db.collection(collectionName).doc(id).update(data);
}
app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'internship-monitor-api' });
});
app.use(authenticate);
app.get('/me', asyncHandler(async (req, res) => {
    res.json(req.user);
}));
app.get('/users', requireRole('admin', 'supervisor'), asyncHandler(async (_req, res) => {
    res.json(await listCollection('users'));
}));
app.post('/users', requireRole('admin'), asyncHandler(async (req, res) => {
    const email = requireString(req.body.email, 'email');
    const password = optionalString(req.body.password);
    const displayName = requireString(req.body.displayName, 'displayName');
    const role = requireString(req.body.role, 'role');
    if (!['student', 'supervisor', 'company', 'admin'].includes(role)) {
        throw new HttpError(400, 'role is invalid');
    }
    const created = password
        ? await auth.createUser({ email, password, displayName })
        : await auth.createUser({ email, displayName });
    const profile = {
        uid: created.uid,
        email,
        displayName,
        role,
        companyId: optionalString(req.body.companyId),
        companyName: optionalString(req.body.companyName),
        supervisorId: optionalString(req.body.supervisorId),
        department: optionalString(req.body.department),
        indexNumber: optionalString(req.body.indexNumber),
        phone: optionalString(req.body.phone),
        createdAt: new Date().toISOString(),
    };
    await db.collection('users').doc(created.uid).set(profile);
    res.status(201).json(profile);
}));
app.get('/users/:uid', asyncHandler(async (req, res) => {
    if (req.user?.role !== 'admin' && req.user?.role !== 'supervisor' && req.user?.uid !== req.params.uid) {
        throw new HttpError(403, 'Insufficient permissions');
    }
    const profile = await getUser(req.params.uid);
    if (!profile)
        throw new HttpError(404, 'User not found');
    res.json(profile);
}));
app.patch('/users/:uid', asyncHandler(async (req, res) => {
    if (req.user?.role !== 'admin' && req.user?.uid !== req.params.uid) {
        throw new HttpError(403, 'Insufficient permissions');
    }
    await db.collection('users').doc(req.params.uid).update(req.body);
    res.status(204).send();
}));
app.delete('/users/:uid', requireRole('admin'), asyncHandler(async (req, res) => {
    await db.collection('users').doc(req.params.uid).delete();
    await auth.deleteUser(req.params.uid).catch(() => undefined);
    res.status(204).send();
}));
app.get('/diaries', asyncHandler(async (req, res) => {
    const studentId = optionalString(req.query.studentId);
    if (studentId && !canAccessStudent(req, studentId))
        throw new HttpError(403, 'Insufficient permissions');
    const filters = req.user?.role === 'student' ? { studentId: req.user.uid } : { studentId };
    res.json(await listCollection('diaries', filters));
}));
app.post('/diaries', requireRole('student', 'admin'), asyncHandler(async (req, res) => {
    const studentId = req.user?.role === 'student' ? req.user.uid : requireString(req.body.studentId, 'studentId');
    const entry = {
        studentId,
        date: requireString(req.body.date, 'date'),
        title: requireString(req.body.title, 'title'),
        content: requireString(req.body.content, 'content'),
        tasksCompleted: requireArray(req.body.tasksCompleted ?? [], 'tasksCompleted'),
        hoursWorked: requireNumber(req.body.hoursWorked, 'hoursWorked'),
        skillsUsed: requireArray(req.body.skillsUsed ?? [], 'skillsUsed'),
        aiEnhanced: optionalString(req.body.aiEnhanced),
        createdAt: new Date().toISOString(),
    };
    res.status(201).json(await createDocument('diaries', entry));
}));
app.patch('/diaries/:id', asyncHandler(async (req, res) => {
    const snap = await db.collection('diaries').doc(req.params.id).get();
    if (!snap.exists)
        throw new HttpError(404, 'Diary entry not found');
    const diary = snap.data();
    if (!canAccessStudent(req, diary.studentId))
        throw new HttpError(403, 'Insufficient permissions');
    await patchDocument('diaries', req.params.id, req.body);
    res.status(204).send();
}));
app.delete('/diaries/:id', asyncHandler(async (req, res) => {
    const snap = await db.collection('diaries').doc(req.params.id).get();
    if (!snap.exists)
        throw new HttpError(404, 'Diary entry not found');
    const diary = snap.data();
    if (!canAccessStudent(req, diary.studentId))
        throw new HttpError(403, 'Insufficient permissions');
    await db.collection('diaries').doc(req.params.id).delete();
    res.status(204).send();
}));
app.get('/reports', asyncHandler(async (req, res) => {
    const studentId = optionalString(req.query.studentId);
    const status = optionalString(req.query.status);
    if (studentId && !canAccessStudent(req, studentId))
        throw new HttpError(403, 'Insufficient permissions');
    const filters = req.user?.role === 'student' ? { studentId: req.user.uid, status } : { studentId, status };
    res.json(await listCollection('reports', filters));
}));
app.post('/reports', requireRole('student', 'admin'), asyncHandler(async (req, res) => {
    const studentId = req.user?.role === 'student' ? req.user.uid : requireString(req.body.studentId, 'studentId');
    const report = {
        studentId,
        studentName: requireString(req.body.studentName, 'studentName'),
        weekStart: requireString(req.body.weekStart, 'weekStart'),
        weekEnd: requireString(req.body.weekEnd, 'weekEnd'),
        summary: requireString(req.body.summary, 'summary'),
        diaryIds: requireArray(req.body.diaryIds ?? [], 'diaryIds'),
        status: (optionalString(req.body.status) ?? 'draft'),
        companyFeedback: optionalString(req.body.companyFeedback),
        supervisorFeedback: optionalString(req.body.supervisorFeedback),
        generatedAt: new Date().toISOString(),
        submittedAt: optionalString(req.body.submittedAt),
    };
    res.status(201).json(await createDocument('reports', report));
}));
app.patch('/reports/:id', asyncHandler(async (req, res) => {
    const snap = await db.collection('reports').doc(req.params.id).get();
    if (!snap.exists)
        throw new HttpError(404, 'Report not found');
    const report = snap.data();
    if (!canAccessStudent(req, report.studentId))
        throw new HttpError(403, 'Insufficient permissions');
    await patchDocument('reports', req.params.id, req.body);
    res.status(204).send();
}));
app.get('/internships', asyncHandler(async (req, res) => {
    const studentId = req.user?.role === 'student' ? req.user.uid : optionalString(req.query.studentId);
    const supervisorId = req.user?.role === 'supervisor' ? req.user.uid : optionalString(req.query.supervisorId);
    res.json(await listCollection('internships', { studentId, universitySupervisorId: supervisorId }));
}));
app.post('/internships', requireRole('admin', 'supervisor'), asyncHandler(async (req, res) => {
    const internship = {
        studentId: requireString(req.body.studentId, 'studentId'),
        studentName: requireString(req.body.studentName, 'studentName'),
        companyName: requireString(req.body.companyName, 'companyName'),
        companySupervisor: requireString(req.body.companySupervisor, 'companySupervisor'),
        universitySupervisorId: requireString(req.body.universitySupervisorId, 'universitySupervisorId'),
        startDate: requireString(req.body.startDate, 'startDate'),
        endDate: requireString(req.body.endDate, 'endDate'),
        status: optionalString(req.body.status) ?? 'pending',
        progress: requireNumber(req.body.progress ?? 0, 'progress'),
    };
    res.status(201).json(await createDocument('internships', internship));
}));
app.patch('/internships/:id', requireRole('admin', 'supervisor'), asyncHandler(async (req, res) => {
    await patchDocument('internships', req.params.id, req.body);
    res.status(204).send();
}));
app.get('/evaluations', asyncHandler(async (req, res) => {
    const studentId = req.user?.role === 'student' ? req.user.uid : optionalString(req.query.studentId);
    res.json(await listCollection('evaluations', { studentId }));
}));
app.post('/evaluations', requireRole('company', 'supervisor', 'admin'), asyncHandler(async (req, res) => {
    const evaluation = {
        studentId: requireString(req.body.studentId, 'studentId'),
        weekReportId: requireString(req.body.weekReportId, 'weekReportId'),
        evaluatorId: req.user?.uid ?? requireString(req.body.evaluatorId, 'evaluatorId'),
        evaluatorRole: req.user?.role === 'admin' ? requireString(req.body.evaluatorRole, 'evaluatorRole') : req.user?.role,
        technicalSkills: req.body.technicalSkills ?? {},
        softSkills: req.body.softSkills ?? {},
        comments: requireString(req.body.comments, 'comments'),
        createdAt: new Date().toISOString(),
    };
    res.status(201).json(await createDocument('evaluations', evaluation));
}));
app.get('/notifications', asyncHandler(async (req, res) => {
    const userId = req.user?.role === 'admin' ? optionalString(req.query.userId) : req.user?.uid;
    res.json(await listCollection('notifications', { userId }));
}));
app.post('/notifications', asyncHandler(async (req, res) => {
    const notification = {
        userId: requireString(req.body.userId, 'userId'),
        title: requireString(req.body.title, 'title'),
        message: requireString(req.body.message, 'message'),
        type: optionalString(req.body.type) ?? 'info',
        read: false,
        createdAt: new Date().toISOString(),
        link: optionalString(req.body.link),
    };
    res.status(201).json(await createDocument('notifications', notification));
}));
app.patch('/notifications/:id/read', asyncHandler(async (req, res) => {
    const snap = await db.collection('notifications').doc(req.params.id).get();
    if (!snap.exists)
        throw new HttpError(404, 'Notification not found');
    const notification = snap.data();
    if (req.user?.role !== 'admin' && notification.userId !== req.user?.uid) {
        throw new HttpError(403, 'Insufficient permissions');
    }
    await patchDocument('notifications', req.params.id, { read: true });
    res.status(204).send();
}));
app.use((error, _req, res, _next) => {
    void _next;
    const status = error instanceof HttpError ? error.status : 500;
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(status).json({ error: message });
});
exports.api = (0, https_1.onRequest)({ region: 'asia-south1' }, app);
//# sourceMappingURL=index.js.map