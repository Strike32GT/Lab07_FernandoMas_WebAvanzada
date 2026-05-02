import userRepository from '../repositories/UserRepository.js';
import { mapUser } from '../utils/userMapper.js';
import bcrypt from 'bcrypt';
import roleRepository from '../repositories/RoleRepository.js';

const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[#$%&*@]).{8,}$/;

class UserService {

    async getAll() {
        const users = await userRepository.getAll();
        return users.map(mapUser);
    }

    async getById(id) {
        const user = await userRepository.findById(id);
        if (!user) {
            const err = new Error('Usuario no encontrado');
            err.status = 404;
            throw err;
        }
        return mapUser(user);
    }

    async updateMe(id, payload) {
        const updates = {
            name: payload.name,
            lastName: payload.lastName,
            phoneNumber: payload.phoneNumber,
            birthdate: payload.birthdate,
            url_profile: payload.url_profile ?? '',
            adress: payload.adress ?? ''
        };

        const user = await userRepository.updateById(id, updates);
        if (!user) {
            const err = new Error('Usuario no encontrado');
            err.status = 404;
            throw err;
        }

        return mapUser(user);
    }

    async createByAdmin(payload) {
        const existing = await userRepository.findByEmail(payload.email);
        if (existing) {
            const err = new Error('El email ya se encuentra en uso');
            err.status = 400;
            throw err;
        }

        if (!passwordRegex.test(payload.password)) {
            const err = new Error('El password debe tener minimo 8 caracteres, 1 mayuscula, 1 digito y 1 caracter especial (# $ % & * @)');
            err.status = 400;
            throw err;
        }

        const roleIds = await this.resolveRoleIds(payload.roles);
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '10', 10);
        const hashed = await bcrypt.hash(payload.password, saltRounds);

        const user = await userRepository.create({
            name: payload.name,
            lastName: payload.lastName,
            email: payload.email,
            password: hashed,
            phoneNumber: payload.phoneNumber,
            birthdate: payload.birthdate,
            url_profile: payload.url_profile ?? '',
            adress: payload.adress ?? '',
            roles: roleIds
        });

        await user.populate('roles');
        return mapUser(user);
    }

    async updateByAdmin(id, payload) {
        const existingUser = await userRepository.findById(id);
        if (!existingUser) {
            const err = new Error('Usuario no encontrado');
            err.status = 404;
            throw err;
        }

        if (payload.email && payload.email !== existingUser.email) {
            const emailOwner = await userRepository.findByEmail(payload.email);
            if (emailOwner) {
                const err = new Error('El email ya se encuentra en uso');
                err.status = 400;
                throw err;
            }
        }

        const updates = {
            name: payload.name,
            lastName: payload.lastName,
            email: payload.email,
            phoneNumber: payload.phoneNumber,
            birthdate: payload.birthdate,
            url_profile: payload.url_profile ?? '',
            adress: payload.adress ?? ''
        };

        if (payload.roles?.length) {
            updates.roles = await this.resolveRoleIds(payload.roles);
        }

        if (payload.password) {
            if (!passwordRegex.test(payload.password)) {
                const err = new Error('El password debe tener minimo 8 caracteres, 1 mayuscula, 1 digito y 1 caracter especial (# $ % & * @)');
                err.status = 400;
                throw err;
            }

            const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '10', 10);
            updates.password = await bcrypt.hash(payload.password, saltRounds);
        }

        const user = await userRepository.updateById(id, updates);
        return mapUser(user);
    }

    async deleteByAdmin(targetUserId, currentUserId) {
        if (targetUserId === currentUserId) {
            const err = new Error('No puedes eliminar tu propio usuario administrador');
            err.status = 400;
            throw err;
        }

        const deletedUser = await userRepository.deleteById(targetUserId);
        if (!deletedUser) {
            const err = new Error('Usuario no encontrado');
            err.status = 404;
            throw err;
        }

        return { message: 'Usuario eliminado correctamente' };
    }

    async resolveRoleIds(roles = ['user']) {
        const normalizedRoles = Array.isArray(roles) ? roles : [roles];
        const roleIds = [];

        for (const roleName of normalizedRoles) {
            let role = await roleRepository.findByName(roleName);
            if (!role) {
                role = await roleRepository.create({ name: roleName });
            }
            roleIds.push(role._id);
        }

        return roleIds;
    }
}

export default new UserService();
