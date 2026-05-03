
const existing = {
    lectureStartTime: null // Simulate existing class having null time
};

try {
    const val = existing?.lectureStartTime?.getUTCHours().toString();
    console.log('Value:', val);
} catch (e) {
    console.log('Error caught:', e.message);
}

// Correct way should involve checking if it exists before toString()
try {
    const safeVal = existing?.lectureStartTime ? existing.lectureStartTime.getUTCHours().toString() : 'undefined';
    console.log('Safe Value:', safeVal);
} catch (e) {
    console.log('Safe Error caught:', e.message);
}
