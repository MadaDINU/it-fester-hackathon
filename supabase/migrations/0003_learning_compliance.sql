-- Critic agent's check of whether each variant respects the learnings it claims to apply.
alter table variants
  add column if not exists learning_compliance jsonb not null default '[]';
