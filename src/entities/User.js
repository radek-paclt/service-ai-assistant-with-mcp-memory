const { EntitySchema } = require('typeorm');

const UserRole = {
  ADMIN: 'admin',
  USER: 'user'
};

const User = new EntitySchema({
  name: 'User',
  tableName: 'users',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    username: {
      type: 'varchar',
      length: 50,
      unique: true,
    },
    passwordHash: {
      type: 'varchar',
      length: 255,
    },
    role: {
      type: 'enum',
      enum: UserRole,
      default: UserRole.USER,
    },
    isTemporaryPassword: {
      type: 'boolean',
      default: false,
    },
    createdAt: {
      type: 'timestamp with time zone',
      createDate: true,
    },
    updatedAt: {
      type: 'timestamp with time zone',
      updateDate: true,
    },
  },
});

module.exports = { User, UserRole };