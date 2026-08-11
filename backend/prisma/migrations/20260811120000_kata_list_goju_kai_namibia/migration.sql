-- The allowable kata list as Goju Kai Namibia runs it: fifteen katas, in
-- competition order. Replaces the broader syllabus seeded with the table in
-- 20260811090000_add_kata_reference.
--
-- Three of these are the same kata under the association's own romanisation, so
-- they are renamed in place rather than dropped and re-inserted — a rename
-- keeps any KataPerformance already recorded against them pointing at the right
-- row, which delete-and-insert would silently break.
UPDATE "Kata" SET "name" = 'Seinchin'  WHERE "id" = 'kata_seiyunchin';
UPDATE "Kata" SET "name" = 'Sanseiru'  WHERE "id" = 'kata_sanseru';
UPDATE "Kata" SET "name" = 'Suarinpei' WHERE "id" = 'kata_suparinpei';

-- Add anything missing, so this lands the same way on a database where a kata
-- was deleted by hand as on one straight from the previous migration.
INSERT INTO "Kata" ("id", "name", "style", "order", "active", "createdAt", "updatedAt") VALUES
  ('kata_taikyoku_jodan',     'Taikyoku Jodan',       'Goju Kai',  10, true, NOW(), NOW()),
  ('kata_taikyoku_chudan',    'Taikyoku Chudan',      'Goju Kai',  20, true, NOW(), NOW()),
  ('kata_taikyoku_gedan',     'Taikyoku Gedan',       'Goju Kai',  30, true, NOW(), NOW()),
  ('kata_taikyoku_kake_uke',  'Taikyoku Kake Uke',    'Goju Kai',  40, true, NOW(), NOW()),
  ('kata_taikyoku_mawashi',   'Taikyoku Mawashi Uke', 'Goju Kai',  50, true, NOW(), NOW()),
  ('kata_gekisai_dai_ichi',   'Gekisai Dai Ichi',     'Goju-ryu',  60, true, NOW(), NOW()),
  ('kata_gekisai_dai_ni',     'Gekisai Dai Ni',       'Goju-ryu',  70, true, NOW(), NOW()),
  ('kata_saifa',              'Saifa',                'Goju-ryu',  80, true, NOW(), NOW()),
  ('kata_seiyunchin',         'Seinchin',             'Goju-ryu',  90, true, NOW(), NOW()),
  ('kata_sanseru',            'Sanseiru',             'Goju-ryu', 100, true, NOW(), NOW()),
  ('kata_seipai',             'Seipai',               'Goju-ryu', 110, true, NOW(), NOW()),
  ('kata_shisochin',          'Shisochin',            'Goju-ryu', 120, true, NOW(), NOW()),
  ('kata_seisan',             'Seisan',               'Goju-ryu', 130, true, NOW(), NOW()),
  ('kata_kururunfa',          'Kururunfa',            'Goju-ryu', 140, true, NOW(), NOW()),
  ('kata_suparinpei',         'Suarinpei',            'Goju-ryu', 150, true, NOW(), NOW())
ON CONFLICT ("name") DO NOTHING;

-- Competition order, in tens so a kata can be inserted between two others
-- without renumbering. Keyed on name, which is unique, so it also fixes up a
-- row that was inserted by hand under a different id. Note the Taikyoku set now
-- runs Jodan -> Chudan -> Gedan.
UPDATE "Kata" SET "order" = v."order", "active" = true, "updatedAt" = NOW()
FROM (VALUES
  ('Taikyoku Jodan', 10), ('Taikyoku Chudan', 20), ('Taikyoku Gedan', 30),
  ('Taikyoku Kake Uke', 40), ('Taikyoku Mawashi Uke', 50),
  ('Gekisai Dai Ichi', 60), ('Gekisai Dai Ni', 70),
  ('Saifa', 80), ('Seinchin', 90), ('Sanseiru', 100), ('Seipai', 110),
  ('Shisochin', 120), ('Seisan', 130), ('Kururunfa', 140), ('Suarinpei', 150)
) AS v("name", "order")
WHERE "Kata"."name" = v."name";

-- Everything else leaves the list. A kata that has already been performed is
-- retired rather than deleted, because a recorded result has to keep resolving
-- to a name — the same rule the app enforces on the Katas screen.
UPDATE "Kata" SET "active" = false, "updatedAt" = NOW()
WHERE "name" NOT IN (
  'Taikyoku Jodan', 'Taikyoku Chudan', 'Taikyoku Gedan',
  'Taikyoku Kake Uke', 'Taikyoku Mawashi Uke',
  'Gekisai Dai Ichi', 'Gekisai Dai Ni',
  'Saifa', 'Seinchin', 'Sanseiru', 'Seipai',
  'Shisochin', 'Seisan', 'Kururunfa', 'Suarinpei'
);

DELETE FROM "Kata"
WHERE "active" = false
  AND NOT EXISTS (SELECT 1 FROM "KataPerformance" p WHERE p."kataId" = "Kata"."id");
