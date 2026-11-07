-- Keep measured AI cost when a brand or campaign is deleted.
alter table ai_usage
  drop constraint ai_usage_brand_id_fkey,
  add constraint ai_usage_brand_id_fkey
    foreign key (brand_id) references brands(id) on delete set null;

alter table ai_usage
  drop constraint ai_usage_campaign_id_fkey,
  add constraint ai_usage_campaign_id_fkey
    foreign key (campaign_id) references campaigns(id) on delete set null;
