// JSDoc types — importable by both client and server for shared typings

/**
 * @typedef {Object} Company
 * @property {string} id
 * @property {string} name
 * @property {string} color
 * @property {string} created_at
 */

/**
 * @typedef {Object} Person
 * @property {string} id
 * @property {string} name
 * @property {string} initials
 * @property {string} avatar_color
 * @property {string[]} company_ids
 * @property {boolean} is_active
 * @property {string} created_at
 */

/**
 * @typedef {'todo'|'inprogress'|'done'|'blocked'} TaskStatus
 * @typedef {'strategy'|'operations'|'follow-up'|'development'} TaskCategory
 * @typedef {1|2|3|4} PriorityQuadrant
 *
 * @typedef {Object} Task
 * @property {string} id
 * @property {string} title
 * @property {string} [description]
 * @property {string} [company_id]
 * @property {string} [assigned_to]
 * @property {string} [parent_task_id]
 * @property {string[]} linked_task_ids
 * @property {TaskCategory} [category]
 * @property {PriorityQuadrant} [priority_quadrant]
 * @property {TaskStatus} status
 * @property {string} [due_date]
 * @property {number} [estimated_hours]
 * @property {number} [actual_hours]
 * @property {boolean} ai_suggested
 * @property {string} created_at
 * @property {string} updated_at
 */

export {};
