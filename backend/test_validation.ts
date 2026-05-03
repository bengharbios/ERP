import { createPaymentSchema } from './src/modules/finance/finance.validation';

const testData = {
    calculationId: "123e4567-e89b-12d3-a456-426614174000", // Valid UUID
    installmentId: "", // Empty string - THIS MIGHT BE THE PROBLEM
    amount: 500,
    method: "CASH",
    referenceNo: "",
    receiptNumber: "",
    paymentDate: "2026-02-02",
    lateFee: 0,
    discount: 0
};

try {
    const data = { ...testData };
    if (data.installmentId === "") delete (data as any).installmentId;
    createPaymentSchema.parse(data);
    console.log("Validation passed with deleted empty installmentId");
} catch (e: any) {
    console.log("Validation failed with deleted empty installmentId:", e.errors);
}

try {
    createPaymentSchema.parse(testData);
    console.log("Validation passed with empty string installmentId");
} catch (e: any) {
    console.log("Validation failed with empty string installmentId:", e.errors);
}
