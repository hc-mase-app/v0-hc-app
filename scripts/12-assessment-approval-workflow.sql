-- Update employee_assessments table to add workflow fields
ALTER TABLE employee_assessments
ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS created_by_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS created_by_role VARCHAR(50),
ADD COLUMN IF NOT EXISTS total_score DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS grade VARCHAR(50),
ADD COLUMN IF NOT EXISTS penalties JSONB;

-- Update status column to use new workflow statuses
-- Status options: 'draft', 'pending_pjo', 'pending_hr_site', 'approved', 'rejected'
ALTER TABLE employee_assessments
ALTER COLUMN status SET DEFAULT 'draft';

-- Create assessment_approvals table for tracking approval history
CREATE TABLE IF NOT EXISTS assessment_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES employee_assessments(id) ON DELETE CASCADE,
  approver_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  approver_name VARCHAR(255) NOT NULL,
  approver_role VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'approved' or 'rejected'
  notes TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employee_assessments_status ON employee_assessments(status);
CREATE INDEX IF NOT EXISTS idx_employee_assessments_created_by ON employee_assessments(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_approvals_assessment_id ON assessment_approvals(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_approvals_approver ON assessment_approvals(approver_user_id);

-- Add comment to explain the workflow
COMMENT ON TABLE employee_assessments IS 'Employee assessment with approval workflow: DIC creates -> PJO approves -> HR Site final approval';
COMMENT ON TABLE assessment_approvals IS 'Tracks approval history for employee assessments';
