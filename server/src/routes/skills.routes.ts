import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { SkillModel } from '../models/Skill.js';

const router = Router();

// GET /api/skills — List all skills
router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const skills = await SkillModel.find({}).lean();
    res.json({ skills });
  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({ error: 'Failed to get skills' });
  }
});

import { LearnerModel } from '../models/Learner.js';
import { resolveOrSynthesizeRole } from '../utils/dynamic-roles.js';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

// GET /api/skills/graph — Get skill graph (nodes + edges for visualization) parameterized dynamically by role
router.get('/graph', async (req: AuthRequest, res: Response) => {
  try {
    let targetRoleId: string | undefined = typeof req.query.role === 'string' ? req.query.role : undefined;

    // If no role query passed, attempt to read learner's active target role from auth token
    if (!targetRoleId) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          const decoded = jwt.verify(token, config.jwtSecret) as { userId: string };
          if (decoded?.userId) {
            const learner = await LearnerModel.findById(decoded.userId).lean();
            const activeGoal = learner?.goals?.[learner.goals.length - 1];
            if ((activeGoal as any)?.targetRole) {
              targetRoleId = (activeGoal as any).targetRole;
            }
          }
        } catch {
          // Token invalid or expired, continue to fallback
        }
      }
    }

    if (!targetRoleId) {
      targetRoleId = 'full-stack-developer';
    }

    // Resolve target role (standard, synthesized, or dual-role)
    let targetRole: any;
    if (targetRoleId.includes('--')) {
      const [primaryId, secondaryId] = targetRoleId.split('--');
      const [pRole, sRole] = await Promise.all([
        resolveOrSynthesizeRole(primaryId),
        resolveOrSynthesizeRole(secondaryId),
      ]);

      const secSkillMap = new Map((sRole.requiredSkills || []).map(s => [s.skillId, s]));
      const mergedMap = new Map<string, any>();

      for (const req of (pRole.requiredSkills || [])) {
        const secReq = secSkillMap.get(req.skillId);
        if (secReq) {
          mergedMap.set(req.skillId, {
            skillId: req.skillId,
            targetProficiency: Math.max(req.targetProficiency || 75, secReq.targetProficiency || 75),
            importance: Math.max(req.importance || 0.8, secReq.importance || 0.8),
          });
        } else {
          mergedMap.set(req.skillId, req);
        }
      }
      for (const req of (sRole.requiredSkills || [])) {
        if (!mergedMap.has(req.skillId)) {
          mergedMap.set(req.skillId, req);
        }
      }

      targetRole = {
        id: targetRoleId,
        name: `${pRole.name} & ${sRole.name}`,
        requiredSkills: Array.from(mergedMap.values()),
      };
    } else {
      targetRole = await resolveOrSynthesizeRole(targetRoleId);
    }

    const reqMap = new Map((targetRole.requiredSkills || []).map((r: any) => [r.skillId, r]));

    const allSkillDocs = await SkillModel.find({}).lean();
    const existingSkillIds = new Set(allSkillDocs.map(s => s.skillId));

    // Ensure any synthesized role skills exist in the graph nodes list
    const combinedSkillList: any[] = [...allSkillDocs];
    for (const req of (targetRole.requiredSkills || [])) {
      if (!existingSkillIds.has(req.skillId)) {
        const readableName = req.skillId.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
        combinedSkillList.push({
          skillId: req.skillId,
          name: readableName,
          category: 'Specialized',
          difficulty: 3,
          estimatedHours: 25,
          prerequisites: [],
          relatedSkills: [],
        });
        existingSkillIds.add(req.skillId);
      }
    }

    // Compute topological milestones for role skills
    const milestoneMap = new Map<string, number>();
    const skillMap = new Map<string, any>(combinedSkillList.map(s => [s.skillId, s]));

    const computeMilestone = (skillId: string, visited = new Set<string>()): number => {
      if (milestoneMap.has(skillId)) return milestoneMap.get(skillId)!;
      if (visited.has(skillId)) return 1;
      visited.add(skillId);

      const skill = skillMap.get(skillId);
      if (!skill || !skill.prerequisites || skill.prerequisites.length === 0) {
        milestoneMap.set(skillId, 1);
        return 1;
      }

      let maxPrereqMilestone = 0;
      for (const p of skill.prerequisites) {
        if (reqMap.has(p)) {
          maxPrereqMilestone = Math.max(maxPrereqMilestone, computeMilestone(p, new Set(visited)));
        }
      }

      const assigned = Math.min(maxPrereqMilestone + 1, 4);
      milestoneMap.set(skillId, assigned);
      return assigned;
    };

    (targetRole.requiredSkills || []).forEach((r: any) => computeMilestone(r.skillId));

    const nodes = combinedSkillList.map(s => {
      const isReq = reqMap.has(s.skillId);
      const reqInfo: any = reqMap.get(s.skillId);
      return {
        id: s.skillId,
        name: s.name,
        category: s.category,
        difficulty: s.difficulty,
        estimatedHours: s.estimatedHours,
        prerequisites: s.prerequisites || [],
        relatedSkills: s.relatedSkills || [],
        isRequired: isReq,
        targetProficiency: reqInfo?.targetProficiency || 75,
        importance: reqInfo?.importance || 0.8,
        milestone: isReq ? (milestoneMap.get(s.skillId) || 1) : 0,
      };
    });

    // Build edges from prerequisites and related skills
    const edges: Array<{ from: string; to: string; type: string }> = [];
    const edgeSet = new Set<string>();

    for (const skill of combinedSkillList) {
      for (const prereqId of (skill.prerequisites || [])) {
        if (existingSkillIds.has(prereqId)) {
          const key = `${prereqId}->${skill.skillId}`;
          if (!edgeSet.has(key)) {
            edgeSet.add(key);
            edges.push({
              from: prereqId,
              to: skill.skillId,
              type: 'PREREQUISITE',
            });
          }
        }
      }
      for (const relatedId of (skill.relatedSkills || [])) {
        if (existingSkillIds.has(relatedId)) {
          const key = `${skill.skillId}->${relatedId}`;
          if (!edgeSet.has(key)) {
            edgeSet.add(key);
            edges.push({
              from: skill.skillId,
              to: relatedId,
              type: 'RELATED_TO',
            });
          }
        }
      }
    }

    res.json({
      nodes,
      edges,
      role: targetRole.name,
      roleId: targetRole.id,
      totalRequiredSkills: (targetRole.requiredSkills || []).length,
    });
  } catch (error) {
    console.error('Get skill graph error:', error);
    res.status(500).json({ error: 'Failed to get skill graph' });
  }
});

// GET /api/skills/:id — Get skill detail
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const skill = await SkillModel.findOne({ skillId: req.params.id }).lean();
    if (!skill) {
      res.status(404).json({ error: 'Skill not found' });
      return;
    }

    // Get prerequisite details
    const prereqSkills = await SkillModel.find({
      skillId: { $in: skill.prerequisites },
    }).lean();

    // Get skills that depend on this one
    const dependentSkills = await SkillModel.find({
      prerequisites: skill.skillId,
    }).lean();

    res.json({
      skill,
      prerequisites: prereqSkills.map(s => ({ id: s.skillId, name: s.name })),
      dependents: dependentSkills.map(s => ({ id: s.skillId, name: s.name })),
    });
  } catch (error) {
    console.error('Get skill detail error:', error);
    res.status(500).json({ error: 'Failed to get skill detail' });
  }
});

export default router;
