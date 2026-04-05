-- Allow school admins to define custom fee types as free text.
ALTER TABLE `SchoolFee`
  MODIFY `fee_type` VARCHAR(80) NOT NULL;
