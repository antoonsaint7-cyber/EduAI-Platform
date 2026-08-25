function requireTenantMembership({membership,tenantId,allowedRoles=[]}){if(!membership||membership.tenant_id!==tenantId)throw new Error('Tenant access denied');if(allowedRoles.length&&!allowedRoles.includes(membership.role))throw new Error('Tenant role denied');return membership;}
function tenantScopedSql(tenantId){if(!tenantId)throw new Error('tenantId is required');return {where:'tenant_id = $1',params:[tenantId]};}
module.exports={requireTenantMembership,tenantScopedSql};
