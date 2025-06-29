const Joi = require('joi');

const schemas = {
  menu: {
    create: Joi.object({}),
    update: Joi.object({})
  },
  role: {
    create: Joi.object({}),
    update: Joi.object({}),
    privileges: Joi.object({
      privileges: Joi.array().items(
        Joi.object({
          menu_id: Joi.number().required(),
          can_view: Joi.number().valid(0, 1).required(),
          can_create: Joi.number().valid(0, 1).required(),
          can_edit: Joi.number().valid(0, 1).required(),
          can_delete: Joi.number().valid(0, 1).required(),
          can_access: Joi.number().valid(0, 1).optional()
        })
      ).required()
    })
  },
  user: {
    create: Joi.object({
      username: Joi.string().required(),
      password: Joi.string().required(),
      full_name: Joi.string().required(),
      role_id: Joi.number().required()
    }),
    update: Joi.object({
      username: Joi.string().optional(),
      password: Joi.string().optional(),
      full_name: Joi.string().optional(),
      role_id: Joi.number().optional()
    }),
    setRole: Joi.object({
      role_id: Joi.number().required()
    })
  },
  doctor: {
    create: Joi.object({}),
    update: Joi.object({})
  },
  doctorSchedule: {
    create: Joi.object({}),
    update: Joi.object({})
  },
  patient: {
    register: Joi.object({})
  },
  appointment: {
    create: Joi.object({}),
    update: Joi.object({})
  },
  vitals: {
    update: Joi.object({})
  },
  visitProcedures: {
    update: Joi.object({})
  },
  visitMedications: {
    update: Joi.object({})
  },
  visitDiagnoses: {
    update: Joi.object({})
  }
};

module.exports = schemas;