export default function HospitalHome() {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-4xl w-full px-6">
          <h1 className="text-4xl font-bold mb-4">
            🏥 Welcome to DocSpace Hospital Portal
          </h1>
  
          <p className="text-gray-600 mb-10">
            Manage doctor verifications, hospital staff, and compliance
          </p>
  
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border rounded-lg p-6 shadow-sm bg-white">
              <h2 className="font-semibold mb-2">
                Doctor Verification
              </h2>
              <p className="text-sm text-gray-600">
                Verify and manage doctors linked to your hospital
              </p>
            </div>
  
            <div className="border rounded-lg p-6 shadow-sm bg-white">
              <h2 className="font-semibold mb-2">
                Staff Management
              </h2>
              <p className="text-sm text-gray-600">
                Manage hospital staff roles and permissions
              </p>
            </div>
  
            <div className="border rounded-lg p-6 shadow-sm bg-white">
              <h2 className="font-semibold mb-2">
                Reports & Compliance
              </h2>
              <p className="text-sm text-gray-600">
                View audit logs and verification reports
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }