import { auth } from "../auth.js";
export const authenticateUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'No authorization token provided' });
            return;
        }
        const token = authHeader.split(' ')[1];
        const headers = new Headers();
        headers.set('authorization', `Bearer ${token}`);
        const session = await auth.api.getSession({
            headers: headers,
        });
        if (!session) {
            res.status(401).json({ error: 'Invalid or expired session' });
            return;
        }
        req.user = session.user;
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({ error: 'Authentication failed' });
    }
};
