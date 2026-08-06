/**
 * Rule groups, rules, rule history and rule checking.
 * All reads and writes go through request(); demo state is session-scoped.
 */

import { request } from '@/services/apiClient';
import { RULES, RULE_GROUPS, RULE_HISTORY } from '@/data/rules.seed';
import { checkCase } from '@/domain/criteria';
import { getCase } from '@/services/cases.service';
import { CURRENT_USER } from '@/data/users.seed';

let groups = RULE_GROUPS.map((g) => ({ ...g }));
let rules = RULES.map((r) => ({ ...r }));
let history = RULE_HISTORY.map((h) => ({ ...h }));

export function listRuleGroups() {
  return request('/rule-groups', {
    fallback: () =>
      groups.map((group) => ({
        ...group,
        ruleCount: rules.filter((r) => r.groupId === group.id).length,
        enabledCount: rules.filter((r) => r.groupId === group.id && r.enabled).length,
      })),
  });
}

export function listRules(groupId) {
  return request(`/rule-groups/${groupId}/rules`, {
    fallback: () => rules.filter((r) => r.groupId === groupId).map((r) => ({ ...r })),
  });
}

export function listAllRules() {
  return request('/rules', { fallback: () => rules.map((r) => ({ ...r })) });
}

export function setRuleEnabled(ruleId, enabled) {
  return request(`/rules/${ruleId}`, {
    method: 'PATCH',
    body: { enabled },
    fallback: () => {
      rules = rules.map((r) =>
        r.id === ruleId ? { ...r, enabled, updatedAt: new Date().toISOString(), updatedBy: CURRENT_USER.name } : r,
      );
      history = [
        {
          id: `rh_${Date.now()}`,
          ruleId,
          at: new Date().toISOString(),
          actor: CURRENT_USER.name,
          action: enabled ? 'Rule enabled' : 'Rule disabled',
          detail: `Toggled from the rule group table.`,
        },
        ...history,
      ];
      return rules.find((r) => r.id === ruleId);
    },
    delay: 200,
  });
}

export function createRule(rule) {
  return request('/rules', {
    method: 'POST',
    body: rule,
    fallback: () => {
      const created = {
        ...rule,
        id: `rule_${String(rules.length + 1).padStart(3, '0')}`,
        runCount: 0,
        lastRunAt: null,
        updatedAt: new Date().toISOString(),
        updatedBy: CURRENT_USER.name,
      };
      rules = [...rules, created];
      history = [
        {
          id: `rh_${Date.now()}`,
          ruleId: created.id,
          at: created.updatedAt,
          actor: CURRENT_USER.name,
          action: 'Rule created',
          detail: `Created in group “${groups.find((g) => g.id === created.groupId)?.name ?? created.groupId}”.`,
        },
        ...history,
      ];
      return created;
    },
    delay: 340,
  });
}

export function createRuleGroup(group) {
  return request('/rule-groups', {
    method: 'POST',
    body: group,
    fallback: () => {
      const created = {
        ...group,
        id: `rg_${Date.now()}`,
        ruleCount: 0,
        runOrder: groups.length + 1,
        updatedAt: new Date().toISOString(),
        updatedBy: CURRENT_USER.name,
      };
      groups = [...groups, created];
      return created;
    },
    delay: 280,
  });
}

export function getRuleHistory(ruleId) {
  return request(`/rules/${ruleId}/history`, {
    fallback: () =>
      history.filter((h) => h.ruleId === ruleId).sort((a, b) => new Date(b.at) - new Date(a.at)),
    delay: 180,
  });
}

/**
 * Rule check: evaluate one case against one rule.
 * Returns per-criterion verdicts so a near-miss can be explained.
 */
export async function runRuleCheck({ ruleId, caseId }) {
  const rule = rules.find((r) => r.id === ruleId);
  if (!rule) throw new Error('Rule not found.');

  const caseRecord = await getCase(caseId);
  if (!caseRecord) throw new Error(`No case found with ID ${caseId}.`);

  return request(`/rules/${ruleId}/check`, {
    method: 'POST',
    body: { caseId },
    fallback: () => ({
      rule,
      caseRecord,
      ...checkCase(caseRecord, rule.criteria, rule.matchType),
    }),
    delay: 320,
  });
}

export default {
  listRuleGroups,
  listRules,
  listAllRules,
  setRuleEnabled,
  createRule,
  createRuleGroup,
  getRuleHistory,
  runRuleCheck,
};
