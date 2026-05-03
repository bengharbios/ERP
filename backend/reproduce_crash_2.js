
const existing = {
    lectureStartTime: null
};

try {
    // This is the implementation in classes.controller.ts
    // existing?.lectureStartTime?.getUTCHours().toString() returns undefined
    // undefined.padStart(2, '0') throws Error
    const val = existing?.lectureStartTime?.getUTCHours().toString().padStart(2, '0');
    console.log('Value:', val);
} catch (e) {
    console.log('Error caught:', e.message);
}
