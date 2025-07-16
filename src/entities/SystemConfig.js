const { EntitySchema } = require('typeorm');

const ConfigType = {
  AI_SYSTEM_PROMPT: 'ai_system_prompt',
  AI_SETTINGS: 'ai_settings',
  GENERAL: 'general'
};

const SystemConfig = new EntitySchema({
  name: 'SystemConfig',
  tableName: 'system_configs',
  columns: {
    id: {
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },
    type: {
      type: 'enum',
      enum: ConfigType,
      unique: true,
    },
    content: {
      type: 'text',
    },
    description: {
      type: 'text',
      nullable: true,
    },
    isActive: {
      type: 'boolean',
      default: true,
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

module.exports = { SystemConfig, ConfigType };