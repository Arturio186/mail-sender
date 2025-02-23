exports.up = function(knex) {
  return knex.schema.createTable('formData', (table) => {
    table.increments('id').primary();
    table.jsonb('form_data').notNullable();
    table.string('ip').notNullable();
    table.string('location').notNullable();
    table.text('user_agent').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('formData');
};
