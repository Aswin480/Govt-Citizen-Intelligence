
// Mock Ration Database to simulate fetching family details
export const RATION_DB = {
    "1234567890": {
        head: "Ramesh Kumar",
        address: "12/B, Gandhi Nagar, Delhi",
        type: "PHH (Priority Household)",
        members: [
            { name: "Sita Devi", relation: "Wife", age: 38, gender: "F", status: "Active" },
            { name: "Rahul Kumar", relation: "Son", age: 18, gender: "M", status: "Student" },
            { name: "Priya Kumar", relation: "Daughter", age: 14, gender: "F", status: "Student" },
            { name: "Kamla Devi", relation: "Mother", age: 72, gender: "F", status: "Pensioner" }
        ]
    },
    "9876543210": {
        head: "John Doe",
        address: "45, Marine Drive, Mumbai",
        type: "NPHH (Non-Priority)",
        members: [
            { name: "Jane Doe", relation: "Wife", age: 35, gender: "F", status: "Active" }
        ]
    }
};

export const fetchFamilyByRation = async (rationCardNo: string) => {
    // Simulate API delay
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const family = RATION_DB[rationCardNo as keyof typeof RATION_DB];
            if (family) resolve(family);
            else reject("Invalid Ration Card Number");
        }, 1000);
    });
};

export const fetchMemberByMobile = async (mobile: string) => {
    // Mock simulation
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                name: "Linked User (" + mobile.slice(-4) + ")",
                relation: "Unknown (Verify)",
                age: 25,
                status: "Pending OTP"
            });
        }, 800);
    });
};
