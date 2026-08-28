export interface FesbRequestType {
  id: string;
  title: string;
}

export interface FesbRequest {
  id: string;

  type: FesbRequestType;

  isSuccessful: boolean;

  details: string | null;
  warningLevel: number | null;

  createdAt: string;
  updatedAt: string;
}
