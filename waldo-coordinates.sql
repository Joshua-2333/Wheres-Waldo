INSERT INTO character_locations (image_id, character_id, x, y)
VALUES
((SELECT id FROM images WHERE name = 'winter'), (SELECT id FROM characters WHERE name = 'wilma'), 0.4906, 0.4165),
((SELECT id FROM images WHERE name = 'winter'), (SELECT id FROM characters WHERE name = 'wizard'), 0.0694, 0.7537),
((SELECT id FROM images WHERE name = 'winter'), (SELECT id FROM characters WHERE name = 'odlaw'), 0.3175, 0.6363),
((SELECT id FROM images WHERE name = 'winter'), (SELECT id FROM characters WHERE name = 'waldo'), 0.8550, 0.7261),
((SELECT id FROM images WHERE name = 'beach'), (SELECT id FROM characters WHERE name = 'odlaw'), 0.1081, 0.3345),
((SELECT id FROM images WHERE name = 'beach'), (SELECT id FROM characters WHERE name = 'wizard'), 0.2706, 0.3355),
((SELECT id FROM images WHERE name = 'beach'), (SELECT id FROM characters WHERE name = 'waldo'), 0.6175, 0.3585),
((SELECT id FROM images WHERE name = 'beach'), (SELECT id FROM characters WHERE name = 'wilma'), 0.7725, 0.3915),
((SELECT id FROM images WHERE name = 'space'), (SELECT id FROM characters WHERE name = 'wilma'), 0.2956, 0.5179),
((SELECT id FROM images WHERE name = 'space'), (SELECT id FROM characters WHERE name = 'waldo'), 0.4044, 0.6223),
((SELECT id FROM images WHERE name = 'space'), (SELECT id FROM characters WHERE name = 'wizard'), 0.7806, 0.5805),
((SELECT id FROM images WHERE name = 'space'), (SELECT id FROM characters WHERE name = 'odlaw'), 0.0712, 0.6888)
ON CONFLICT (image_id, character_id)
DO UPDATE SET x = EXCLUDED.x, y = EXCLUDED.y;
