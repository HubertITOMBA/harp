-- Verrous transactionnels des identifiants de famille HARP.
-- Sur DEV, ce SQL a été exécuté manuellement dans MariaDB.
-- La migration y a ensuite été marquée appliquée avec prisma migrate resolve --applied.
-- Ce statut concerne DEV uniquement. Il ne préjuge ni de PREPROD ni de PROD.

-- CreateTable
CREATE TABLE `harpdisplaylock` (
    `typenvid` INTEGER NOT NULL,

    PRIMARY KEY (`typenvid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
