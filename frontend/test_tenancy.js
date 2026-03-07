import axios from 'axios';

async function testApi() {
    try {
        // 1. Login
        console.log("Logging in...");
        const loginRes = await axios.post('http://localhost:8080/api/auth/login', {
            email: 'admin99@test.com',
            password: 'password'
        });

        const token = loginRes.data.token;
        const payloadBuffer = Buffer.from(token.split('.')[1], 'base64');
        const decoded = JSON.parse(payloadBuffer.toString('utf-8'));

        const userId = decoded.id;
        console.log("User ID:", userId);

        // 2. Create property
        console.log("Creating property...");
        const createPropRes = await axios.post('http://localhost:8080/api/properties', {
            title: "Test Property",
            description: "Test Desc",
            type: "APARTMENT",
            purpose: "RENT",
            price: 1000,
            city: "Test City",
            state: "Test State",
            amenities: ["WiFi"],
            images: []
        }, { headers: { Authorization: `Bearer ${token}` } });

        const propertyId = createPropRes.data.id;
        console.log("Created property:", propertyId);

        // 2.5 Mark property as APPROVED so we can mark it as rented (if necessary)
        // Actually, TenancyController doesn't check if it's APPROVED. It just sets it to RENTED.

        // 3. Hit the tenancy endpoint
        console.log(`Hitting tenancy endpoint with prop ${propertyId} and owner ${userId}...`);
        const payload = {
            propertyId: propertyId,
            ownerId: userId,
            tenantName: "John Doe",
            tenantPhone: "+1234567890",
            rentAmount: 5000,
            startDate: "2026-03-04T00:00:00"
        };

        const tenancyRes = await axios.post('http://localhost:8080/api/tenancies', payload, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        console.log("Success! Status:", tenancyRes.status);
        console.log("Response:", tenancyRes.data);

    } catch (err) {
        if (err.response) {
            console.error("ERROR STATUS:", err.response.status);
            console.error("ERROR DATA:", err.response.data);
        } else {
            console.error("NETWORK ERROR:", err.message);
        }
    }
}

testApi();
