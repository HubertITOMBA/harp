-- Vérifier s'il y a des menus avec TMA_LOCAL dans harpmenurole
SELECT 
    hm.id,
    hm.menu,
    hm.role as menu_role,
    hr.role as harprole_role
FROM harpmenus hm
LEFT JOIN harpmenurole hmr ON hm.id = hmr.menuId
LEFT JOIN harproles hr ON hmr.roleId = hr.id
WHERE hm.role = 'TMA_LOCAL' OR hr.role = 'TMA_LOCAL';
