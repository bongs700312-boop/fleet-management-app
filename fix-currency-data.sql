-- Remove dollar signs from fines amounts
UPDATE fines
SET amount = REPLACE(amount::text, '$', '')::decimal
WHERE amount::text LIKE '%$%';

-- Remove dollar signs from carwash costs
UPDATE carwashes
SET cost = REPLACE(cost::text, '$', '')::decimal
WHERE cost::text LIKE '%$%';

-- Remove dollar signs from petrol fillup amounts
UPDATE petrol_fillups
SET amount = REPLACE(amount::text, '$', '')::decimal
WHERE amount::text LIKE '%$%';
