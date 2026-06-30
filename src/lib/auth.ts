// Employability score calculation — no bcrypt needed
const SKILL_WEIGHTS: Record<string, number> = {
  communicationSkills:   0.15,
  problemSolving:        0.15,
  technicalKnowledge:    0.15,
  teamworkCollaboration: 0.10,
  timeManagement:        0.10,
  leadershipSkills:      0.10,
  criticalThinking:      0.10,
  emotionalIntelligence: 0.08,
  industryReadiness:     0.07,
};

export function computeEmployabilityScore(sectionB: Record<string, number>): number {
  const weightedSum = Object.entries(SKILL_WEIGHTS).reduce((sum, [key, weight]) => {
    return sum + ((sectionB[key] ?? 1) * weight);
  }, 0);
  return Math.round(((weightedSum - 1) / 4) * 100);
}

export function getReadinessLevel(score: number): string {
  if (score >= 80) return 'Very High';
  if (score >= 60) return 'High';
  if (score >= 40) return 'Moderate';
  return 'Low';
}