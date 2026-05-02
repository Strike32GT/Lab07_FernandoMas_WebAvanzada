function calculateAge(birthdate) {
    const today = new Date();
    const birth = new Date(birthdate);

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age -= 1;
    }

    return age;
}

export function mapUser(user) {
    return {
        id: user._id,
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        birthdate: user.birthdate,
        age: calculateAge(user.birthdate),
        url_profile: user.url_profile,
        adress: user.adress,
        roles: user.roles.map((role) => role.name),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    };
}

