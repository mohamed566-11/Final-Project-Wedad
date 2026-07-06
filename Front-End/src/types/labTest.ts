// ─── Lab Test Types ──────────────────────────────────────────────────────────

export interface TestResult {
  test_name: string;
  value: string;
  reference_range: string;
  unit: string;
  status: 'low' | 'normal' | 'high' | null;
}

export interface LabTestResults {
  tests: TestResult[];
  patient_info: {
    name: string | null;
    age: string | null;
    date: string | null;
  };
  lab_info: {
    lab_name: string | null;
    doctor_name: string | null;
  };
}

export type LabTestStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface LabTest {
  id: number;
  status: LabTestStatus;
  image_url: string;
  results: LabTestResults | null;
  tests_count: number;
  error_message: string | null;
  processed_at: string | null;
  created_at: string;
}

export interface UploadLabTestResponse {
  lab_test_id: number;
  status: LabTestStatus;
}

export interface LabTestStatusResponse {
  id: number;
  status: LabTestStatus;
  results: LabTestResults | null;
  error_message: string | null;
}
