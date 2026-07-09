export type Stage = {
  id: string;
  pipelineId: string;
  name: string;
  sortOrder: number;
  isWon: boolean;
  isLost: boolean;
};

export type LeadOwner = { id: string; name: string };

export type Activity = {
  id: string;
  body: string;
  createdAt: string;
  author: LeadOwner | null;
};

export type Lead = {
  id: string;
  pipelineId: string;
  stageId: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  expectedValue: number | null;
  source: string | null;
  notes: string | null;
  nextActionAt: string | null;
  nextActionNote: string | null;
  closedAt: string | null;
  revenueEntryId: string | null;
  createdAt: string;
  updatedAt: string;
  pipeline: { id: string; name: string; colour: string };
  stage: Stage;
  owner: LeadOwner | null;
  activity?: Activity[];
};

export type PipelineOption = { id: string; name: string; colour: string };
export type UserOption = { id: string; name: string };
