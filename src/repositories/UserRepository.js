import User from '../models/User.js';

class UserRepository {
    async create(userData) {
        const user = new User(userData);
        return user.save();
    }

    async findByEmail(email) {
        return User.findOne({ email }).populate('roles').exec();
    }

    async findById(id) {
        return User.findById(id).populate('roles').exec();
    }

    async updateById(id, userData) {
        return User.findByIdAndUpdate(id, userData, {
            new: true,
            runValidators: true
        }).populate('roles').exec();
    }

    async deleteById(id) {
        return User.findByIdAndDelete(id).populate('roles').exec();
    }

    async getAll() {
        return User.find().populate('roles').exec();
    }
}

export default new UserRepository();
