import userService from '../services/UserService.js';

class UserController {

    async getAll(req, res, next) {
        try {
            const users = await userService.getAll();
            res.status(200).json(users);
        } catch (err) {
            next(err);
        }
    }

    async getMe(req, res, next) {
        try {
            const user = await userService.getById(req.userId);
            res.status(200).json(user);
        } catch (err) {
            next(err);
        }
    }

    async updateMe(req, res, next) {
        try {
            const user = await userService.updateMe(req.userId, req.body);
            res.status(200).json(user);
        } catch (err) {
            next(err);
        }
    }

    async getById(req, res, next) {
        try {
            const user = await userService.getById(req.params.id);
            res.status(200).json(user);
        } catch (err) {
            next(err);
        }
    }

    async create(req, res, next) {
        try {
            const user = await userService.createByAdmin(req.body);
            res.status(201).json(user);
        } catch (err) {
            next(err);
        }
    }

    async update(req, res, next) {
        try {
            const user = await userService.updateByAdmin(req.params.id, req.body);
            res.status(200).json(user);
        } catch (err) {
            next(err);
        }
    }

    async remove(req, res, next) {
        try {
            const result = await userService.deleteByAdmin(req.params.id, req.userId);
            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }
}

export default new UserController();
