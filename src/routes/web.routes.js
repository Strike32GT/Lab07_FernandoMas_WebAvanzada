import express from 'express';

const router = express.Router();

router.get('/', (req, res) => res.redirect('/signIn'));
router.get('/signIn', (req, res) => res.render('signIn', { title: 'Iniciar sesion', showNav: false, bodyClass: 'auth-body' }));
router.get('/signUp', (req, res) => res.render('signUp', { title: 'Crear cuenta', showNav: false, bodyClass: 'auth-body' }));
router.get('/profile', (req, res) => res.render('profile', { title: 'Mi cuenta', showNav: true }));
router.get('/dashboard/user', (req, res) => res.render('dashboard-user', { title: 'Dashboard usuario', showNav: true }));
router.get('/dashboard/admin', (req, res) => res.render('dashboard-admin', { title: 'Dashboard administrador', showNav: true }));
router.get('/403', (req, res) => res.status(403).render('403', { title: 'Acceso denegado', showNav: true }));

export default router;
