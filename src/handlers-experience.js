import { getConnection, API_VERSION } from "./connection.js";
import { buildZip, deployZip, buildPackageXml } from "./metadata-utils.js";

// ─── List Experience Sites ────────────────────────────────────────────────────
export async function listExperienceSites({ filter, status }) {
  const conn = await getConnection();
  let soql = `SELECT Id, Name, Status, UrlPathPrefix, GuestUserId, OptionsGuestEnabled,
              OptionsAllowNewSelfRegistrations, Template, Description, LastModifiedDate
              FROM Network`;
  const conditions = [];
  if (filter) conditions.push(`Name LIKE '%${filter}%'`);
  if (status) conditions.push(`Status = '${status}'`);
  if (conditions.length > 0) soql += ` WHERE ${conditions.join(" AND ")}`;
  soql += " ORDER BY Name";

  const result = await conn.query(soql);
  return { count: result.totalSize, sites: result.records };
}

// ─── Get Experience Site Details ──────────────────────────────────────────────
export async function getExperienceSite({ site_name }) {
  const conn = await getConnection();
  const result = await conn.query(
    `SELECT Id, Name, Status, UrlPathPrefix, GuestUserId, OptionsGuestEnabled,
            OptionsAllowNewSelfRegistrations, OptionsMembersCanSeeEachOtherFullNames,
            Template, Description, BrandingSet, NavigationType,
            SelfRegProfileId, SelfRegProfile.Name,
            GuestUser.Name, GuestUser.Username,
            LastModifiedDate, LastModifiedBy.Name
     FROM Network WHERE Name = '${site_name}' LIMIT 1`
  );
  if (result.records.length === 0) throw new Error(`Experience site '${site_name}' not found`);

  const site = result.records[0];

  // Get member counts
  const memberCount = await conn.query(
    `SELECT COUNT() FROM NetworkMember WHERE NetworkId = '${site.Id}'`
  ).catch(() => ({ totalSize: 0 }));

  return { ...site, memberCount: memberCount.totalSize };
}

// ─── Publish Experience Site ──────────────────────────────────────────────────
export async function publishExperienceSite({ site_name }) {
  const conn = await getConnection();
  const result = await conn.query(
    `SELECT Id FROM Network WHERE Name = '${site_name}' LIMIT 1`
  );
  if (result.records.length === 0) throw new Error(`Experience site '${site_name}' not found`);

  const networkId = result.records[0].Id;
  // Use Connect API to publish
  const publishResult = await conn.requestPost(
    `/services/data/v${API_VERSION}/connect/communities/${networkId}/publish`,
    {}
  );
  return { success: true, site: site_name, result: publishResult };
}

// ─── Get Site Pages ───────────────────────────────────────────────────────────
export async function getSitePages({ site_name }) {
  const conn = await getConnection();
  const networkResult = await conn.query(
    `SELECT Id FROM Network WHERE Name = '${site_name}' LIMIT 1`
  );
  if (networkResult.records.length === 0) throw new Error(`Site '${site_name}' not found`);

  const networkId = networkResult.records[0].Id;

  // Get flexipages associated with this network
  const pages = await conn.query(
    `SELECT Id, MasterLabel, Type, EntityDefinitionId FROM FlexiPage
     WHERE ParentType = 'Network' LIMIT 200`
  ).catch(() => ({ records: [] }));

  // Also get site.com pages
  const sitePages = await conn.query(
    `SELECT Id, Name, Title, IsPublished, LastModifiedDate FROM SitePage
     WHERE SiteId IN (SELECT SiteId FROM Network WHERE Id = '${networkId}') LIMIT 200`
  ).catch(() => ({ records: [] }));

  return {
    networkId,
    flexiPages: pages.records,
    sitePages: sitePages.records,
  };
}

// ─── Get Network Settings ─────────────────────────────────────────────────────
export async function getNetworkSettings({ site_name }) {
  const conn = await getConnection();
  const result = await conn.query(
    `SELECT Id, Name, Status, UrlPathPrefix, Template,
            OptionsGuestEnabled, OptionsAllowNewSelfRegistrations,
            OptionsMembersCanSeeEachOtherFullNames, OptionsPrivateMessagesEnabled,
            OptionsChatterEnabled, OptionsKnowledgeableEnabled,
            OptionsReputationEnabled, OptionsExperienceBundleBasedSnaOverrideEnabled,
            WelcomeEmailTemplateId, ForgotPasswordEmailTemplateId,
            ChangePasswordEmailTemplateId, NewSenderAddress,
            CaseCommentEmailTemplateId, SelfRegProfileId
     FROM Network WHERE Name = '${site_name}' LIMIT 1`
  );
  if (result.records.length === 0) throw new Error(`Site '${site_name}' not found`);
  return result.records[0];
}

// ─── Update Network Settings ──────────────────────────────────────────────────
export async function updateNetworkSettings({ site_name, settings }) {
  const conn = await getConnection();
  const result = await conn.query(
    `SELECT Id FROM Network WHERE Name = '${site_name}' LIMIT 1`
  );
  if (result.records.length === 0) throw new Error(`Site '${site_name}' not found`);

  const networkId = result.records[0].Id;
  await conn.sobject("Network").update({ Id: networkId, ...settings });
  return { success: true, site: site_name, updated: settings };
}

// ══════════════════════════════════════════════════════════════════════════════
// PORTAL USERS
// ══════════════════════════════════════════════════════════════════════════════

// ─── List Portal Users ────────────────────────────────────────────────────────
export async function listPortalUsers({ site_name, filter, is_active, limit }) {
  const conn = await getConnection();

  let soql = `SELECT Id, Username, Name, Email, IsActive, ProfileId, Profile.Name,
              ContactId, Contact.Name, Contact.AccountId, Contact.Account.Name,
              LastLoginDate, CreatedDate
              FROM User
              WHERE UserType IN ('CspLitePortal', 'CustomerSuccess', 'PowerCustomerSuccess', 'PowerPartner', 'Guest')`;

  if (is_active !== undefined) soql += ` AND IsActive = ${is_active}`;
  if (filter) soql += ` AND (Name LIKE '%${filter}%' OR Email LIKE '%${filter}%')`;

  if (site_name) {
    const networkResult = await conn.query(
      `SELECT Id FROM Network WHERE Name = '${site_name}' LIMIT 1`
    );
    if (networkResult.records.length > 0) {
      const networkId = networkResult.records[0].Id;
      const memberIds = await conn.query(
        `SELECT MemberId FROM NetworkMember WHERE NetworkId = '${networkId}' LIMIT 1000`
      );
      const ids = memberIds.records.map((r) => `'${r.MemberId}'`).join(",");
      if (ids) soql += ` AND Id IN (${ids})`;
    }
  }

  soql += ` ORDER BY Name LIMIT ${limit || 50}`;
  const result = await conn.query(soql);
  return { count: result.totalSize, users: result.records };
}

// ─── Get Portal User ──────────────────────────────────────────────────────────
export async function getPortalUser({ username_or_email }) {
  const conn = await getConnection();
  const result = await conn.query(
    `SELECT Id, Username, Name, FirstName, LastName, Email, IsActive,
            ProfileId, Profile.Name, UserRoleId, UserRole.Name,
            ContactId, Contact.Name, Contact.AccountId, Contact.Account.Name,
            Phone, MobilePhone, Title, Department, CompanyName,
            LastLoginDate, CreatedDate, CreatedBy.Name
     FROM User
     WHERE (Username = '${username_or_email}' OR Email = '${username_or_email}')
     AND UserType IN ('CspLitePortal','CustomerSuccess','PowerCustomerSuccess','PowerPartner')
     LIMIT 1`
  );
  if (result.records.length === 0) throw new Error(`Portal user '${username_or_email}' not found`);
  return result.records[0];
}

// ─── Create Portal User ───────────────────────────────────────────────────────
export async function createPortalUser({ contact_id, profile_name, username, email, first_name, last_name, send_welcome_email }) {
  const conn = await getConnection();

  // Get profile ID
  const profileResult = await conn.query(
    `SELECT Id FROM Profile WHERE Name = '${profile_name}' LIMIT 1`
  );
  if (profileResult.records.length === 0) throw new Error(`Profile '${profile_name}' not found`);
  const profileId = profileResult.records[0].Id;

  // Get contact details if not provided
  let contactData = {};
  if (contact_id) {
    const contactResult = await conn.query(
      `SELECT Id, FirstName, LastName, Email, AccountId FROM Contact WHERE Id = '${contact_id}' LIMIT 1`
    );
    if (contactResult.records.length > 0) {
      contactData = contactResult.records[0];
    }
  }

  const userRecord = {
    Username: username || email,
    Email: email || contactData.Email,
    FirstName: first_name || contactData.FirstName,
    LastName: last_name || contactData.LastName,
    Alias: (first_name || contactData.FirstName || "user").substring(0, 1) +
           (last_name || contactData.LastName || "name").substring(0, 7),
    ProfileId: profileId,
    ContactId: contact_id,
    EmailEncodingKey: "UTF-8",
    LanguageLocaleKey: "en_US",
    LocaleSidKey: "en_US",
    TimeZoneSidKey: "America/New_York",
  };

  const createResult = await conn.sobject("User").create(userRecord);
  if (!createResult.success) {
    throw new Error(`Failed to create portal user: ${JSON.stringify(createResult.errors)}`);
  }

  return {
    success: true,
    userId: createResult.id,
    username: userRecord.Username,
    email: userRecord.Email,
    profile: profile_name,
  };
}

// ─── Enable / Disable Portal User ────────────────────────────────────────────
export async function setPortalUserActive({ username_or_email, is_active }) {
  const conn = await getConnection();
  const result = await conn.query(
    `SELECT Id FROM User WHERE (Username = '${username_or_email}' OR Email = '${username_or_email}') LIMIT 1`
  );
  if (result.records.length === 0) throw new Error(`User '${username_or_email}' not found`);

  await conn.sobject("User").update({ Id: result.records[0].Id, IsActive: is_active });
  return { success: true, userId: result.records[0].Id, isActive: is_active };
}

// ─── Reset Portal User Password ───────────────────────────────────────────────
export async function resetPortalUserPassword({ username_or_email }) {
  const conn = await getConnection();
  const result = await conn.query(
    `SELECT Id FROM User WHERE (Username = '${username_or_email}' OR Email = '${username_or_email}') LIMIT 1`
  );
  if (result.records.length === 0) throw new Error(`User '${username_or_email}' not found`);

  const userId = result.records[0].Id;
  await conn.request({
    method: "POST",
    url: `/services/data/v${API_VERSION}/sobjects/User/${userId}/password`,
    body: "{}",
    headers: { "Content-Type": "application/json" },
  });
  return { success: true, userId, message: "Password reset email sent" };
}

// ─── Assign Permission Set to User ───────────────────────────────────────────
export async function assignPermissionSet({ username_or_email, permission_set_name }) {
  const conn = await getConnection();

  const [userResult, psResult] = await Promise.all([
    conn.query(`SELECT Id FROM User WHERE (Username = '${username_or_email}' OR Email = '${username_or_email}') LIMIT 1`),
    conn.query(`SELECT Id FROM PermissionSet WHERE Name = '${permission_set_name}' LIMIT 1`),
  ]);

  if (userResult.records.length === 0) throw new Error(`User '${username_or_email}' not found`);
  if (psResult.records.length === 0) throw new Error(`Permission Set '${permission_set_name}' not found`);

  const assignment = await conn.sobject("PermissionSetAssignment").create({
    AssigneeId: userResult.records[0].Id,
    PermissionSetId: psResult.records[0].Id,
  });

  if (!assignment.success) throw new Error(`Assignment failed: ${JSON.stringify(assignment.errors)}`);
  return {
    success: true,
    assignmentId: assignment.id,
    user: username_or_email,
    permissionSet: permission_set_name,
  };
}

// ─── List Members of a Site ───────────────────────────────────────────────────
export async function listNetworkMembers({ site_name, limit }) {
  const conn = await getConnection();
  const networkResult = await conn.query(
    `SELECT Id FROM Network WHERE Name = '${site_name}' LIMIT 1`
  );
  if (networkResult.records.length === 0) throw new Error(`Site '${site_name}' not found`);

  const networkId = networkResult.records[0].Id;
  const result = await conn.query(
    `SELECT Id, MemberId, Member.Name, Member.Email, Member.IsActive, ReputationPoints, LastChatterActivityDate
     FROM NetworkMember WHERE NetworkId = '${networkId}'
     ORDER BY Member.Name LIMIT ${limit || 50}`
  );
  return { networkId, count: result.totalSize, members: result.records };
}

// ══════════════════════════════════════════════════════════════════════════════
// NAVIGATION MENUS
// ══════════════════════════════════════════════════════════════════════════════

// ─── List Navigation Menus ────────────────────────────────────────────────────
export async function listNavigationMenus({ site_name }) {
  const conn = await getConnection();
  let soql = `SELECT Id, MasterLabel, DeveloperName, NetworkId, Network.Name, LastModifiedDate
              FROM NavigationLinkSet`;
  if (site_name) {
    soql += ` WHERE Network.Name = '${site_name}'`;
  }
  soql += " ORDER BY MasterLabel";
  const result = await conn.query(soql);
  return { count: result.totalSize, menus: result.records };
}

// ─── Get Navigation Menu Items ────────────────────────────────────────────────
export async function getNavigationMenu({ menu_name }) {
  const conn = await getConnection();
  const menuResult = await conn.query(
    `SELECT Id, MasterLabel, DeveloperName, NetworkId FROM NavigationLinkSet
     WHERE MasterLabel = '${menu_name}' OR DeveloperName = '${menu_name}' LIMIT 1`
  );
  if (menuResult.records.length === 0) throw new Error(`Navigation menu '${menu_name}' not found`);

  const menuId = menuResult.records[0].Id;
  const items = await conn.query(
    `SELECT Id, Label, Target, Type, DefaultListViewId, Position, ParentId, Status
     FROM NavigationMenuItem WHERE NavigationLinkSetId = '${menuId}'
     ORDER BY Position`
  );

  return {
    menu: menuResult.records[0],
    items: items.records,
  };
}

// ─── Update Navigation Menu ───────────────────────────────────────────────────
export async function updateNavigationMenuItem({ menu_name, item_label, updates }) {
  const conn = await getConnection();
  const menuResult = await conn.query(
    `SELECT Id FROM NavigationLinkSet WHERE MasterLabel = '${menu_name}' OR DeveloperName = '${menu_name}' LIMIT 1`
  );
  if (menuResult.records.length === 0) throw new Error(`Menu '${menu_name}' not found`);

  const itemResult = await conn.query(
    `SELECT Id FROM NavigationMenuItem
     WHERE NavigationLinkSetId = '${menuResult.records[0].Id}' AND Label = '${item_label}' LIMIT 1`
  );
  if (itemResult.records.length === 0) throw new Error(`Menu item '${item_label}' not found`);

  await conn.sobject("NavigationMenuItem").update({ Id: itemResult.records[0].Id, ...updates });
  return { success: true, menu: menu_name, item: item_label, updated: updates };
}

// ─── Create Navigation Menu Item ─────────────────────────────────────────────
export async function createNavigationMenuItem({ menu_name, label, target, type, position, parent_label }) {
  const conn = await getConnection();
  const menuResult = await conn.query(
    `SELECT Id FROM NavigationLinkSet WHERE MasterLabel = '${menu_name}' OR DeveloperName = '${menu_name}' LIMIT 1`
  );
  if (menuResult.records.length === 0) throw new Error(`Menu '${menu_name}' not found`);

  const menuId = menuResult.records[0].Id;
  let parentId = null;

  if (parent_label) {
    const parentResult = await conn.query(
      `SELECT Id FROM NavigationMenuItem WHERE NavigationLinkSetId = '${menuId}' AND Label = '${parent_label}' LIMIT 1`
    );
    if (parentResult.records.length > 0) parentId = parentResult.records[0].Id;
  }

  const item = {
    NavigationLinkSetId: menuId,
    Label: label,
    Target: target,
    Type: type || "InternalLink",
    Position: position || 1,
    Status: "Live",
    ...(parentId && { ParentId: parentId }),
  };

  const result = await conn.sobject("NavigationMenuItem").create(item);
  if (!result.success) throw new Error(`Failed to create menu item: ${JSON.stringify(result.errors)}`);
  return { success: true, id: result.id, label, menu: menu_name };
}

// ══════════════════════════════════════════════════════════════════════════════
// CMS CONTENT
// ══════════════════════════════════════════════════════════════════════════════

// ─── List CMS Spaces ──────────────────────────────────────────────────────────
export async function listCmsSpaces() {
  const conn = await getConnection();
  const result = await conn.requestGet(
    `/services/data/v${API_VERSION}/connect/cms/spaces`
  );
  return result;
}

// ─── List CMS Content ─────────────────────────────────────────────────────────
export async function listCmsContent({ space_id, content_type, filter, managed_content_type }) {
  const conn = await getConnection();
  let url = `/services/data/v${API_VERSION}/connect/cms/contents?pageSize=50`;
  if (space_id) url += `&spaceId=${space_id}`;
  if (managed_content_type) url += `&managedContentType=${managed_content_type}`;
  if (filter) url += `&search=${encodeURIComponent(filter)}`;

  const result = await conn.requestGet(url);
  return result;
}

// ─── Get CMS Content Item ─────────────────────────────────────────────────────
export async function getCmsContent({ content_key }) {
  const conn = await getConnection();
  const result = await conn.requestGet(
    `/services/data/v${API_VERSION}/connect/cms/contents/${content_key}`
  );
  return result;
}

// ─── Publish CMS Content ──────────────────────────────────────────────────────
export async function publishCmsContent({ content_key, channel_ids }) {
  const conn = await getConnection();
  const body = channel_ids ? { channelIds: channel_ids } : {};
  const result = await conn.requestPost(
    `/services/data/v${API_VERSION}/connect/cms/contents/${content_key}/publish`,
    body
  );
  return { success: true, content_key, result };
}

// ─── Create CMS Content ───────────────────────────────────────────────────────
export async function createCmsContent({ space_id, title, content_type, content_body, channel_ids }) {
  const conn = await getConnection();
  const body = {
    spaceId: space_id,
    title,
    type: content_type || "cms_document",
    contentBody: content_body || {},
    ...(channel_ids && { channels: { channelIds: channel_ids } }),
  };
  const result = await conn.requestPost(
    `/services/data/v${API_VERSION}/connect/cms/contents`,
    body
  );
  return result;
}

// ══════════════════════════════════════════════════════════════════════════════
// BRANDING & THEMING
// ══════════════════════════════════════════════════════════════════════════════

// ─── Get Site Branding ────────────────────────────────────────────────────────
export async function getSiteBranding({ site_name }) {
  const conn = await getConnection();
  const networkResult = await conn.query(
    `SELECT Id, BrandingSet FROM Network WHERE Name = '${site_name}' LIMIT 1`
  );
  if (networkResult.records.length === 0) throw new Error(`Site '${site_name}' not found`);

  const networkId = networkResult.records[0].Id;
  try {
    const branding = await conn.requestGet(
      `/services/data/v${API_VERSION}/connect/communities/${networkId}/branding`
    );
    return branding;
  } catch (e) {
    return { networkId, brandingSet: networkResult.records[0].BrandingSet, note: "Branding API may require Enhanced Sites" };
  }
}

// ─── Update Site Branding ─────────────────────────────────────────────────────
export async function updateSiteBranding({ site_name, branding }) {
  const conn = await getConnection();
  const networkResult = await conn.query(
    `SELECT Id FROM Network WHERE Name = '${site_name}' LIMIT 1`
  );
  if (networkResult.records.length === 0) throw new Error(`Site '${site_name}' not found`);

  const networkId = networkResult.records[0].Id;
  const result = await conn.request({
    method: "PATCH",
    url: `/services/data/v${API_VERSION}/connect/communities/${networkId}/branding`,
    body: JSON.stringify(branding),
    headers: { "Content-Type": "application/json" },
  });
  return { success: true, site: site_name, updated: branding };
}

// ─── Get Community Analytics ──────────────────────────────────────────────────
export async function getCommunityAnalytics({ site_name }) {
  const conn = await getConnection();
  const networkResult = await conn.query(
    `SELECT Id FROM Network WHERE Name = '${site_name}' LIMIT 1`
  );
  if (networkResult.records.length === 0) throw new Error(`Site '${site_name}' not found`);

  const networkId = networkResult.records[0].Id;
  const [loginHistory, memberCount, newMembers] = await Promise.all([
    conn.query(`SELECT COUNT() FROM NetworkUserHistoryRecent WHERE NetworkId = '${networkId}'`).catch(() => ({ totalSize: 0 })),
    conn.query(`SELECT COUNT() FROM NetworkMember WHERE NetworkId = '${networkId}'`).catch(() => ({ totalSize: 0 })),
    conn.query(`SELECT COUNT() FROM NetworkMember WHERE NetworkId = '${networkId}' AND CreatedDate = LAST_N_DAYS:30`).catch(() => ({ totalSize: 0 })),
  ]);

  return {
    site: site_name,
    networkId,
    totalMembers: memberCount.totalSize,
    newMembersLast30Days: newMembers.totalSize,
    recentLogins: loginHistory.totalSize,
  };
}
