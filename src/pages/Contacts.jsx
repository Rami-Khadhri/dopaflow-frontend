// Contacts.jsx
import React from 'react';

const Contacts = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#333]">Contacts Management</h1>
        <div className="flex space-x-4">
          <button className="bg-[#0056B3] text-white px-4 py-2 rounded-lg hover:bg-[#004499] flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Contact
          </button>
          <input 
            type="text" 
            placeholder="Search contacts..." 
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0056B3]"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[#E0E0E0]">
        <div className="p-6">
          <div className="grid grid-cols-5 gap-4 text-sm font-medium text-[#666] border-b pb-4">
            <span>Name</span>
            <span>Company</span>
            <span>Email</span>
            <span>Phone</span>
            <span>Actions</span>
          </div>
          
          {/* Contact Items */}
          {[1,2,3].map((item) => (
            <div key={item} className="grid grid-cols-5 gap-4 items-center py-4 border-b last:border-0 group hover:bg-gray-50 transition">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-[#0056B3]/10 flex items-center justify-center mr-3">
                  <span className="text-[#0056B3] font-medium">AJ</span>
                </div>
                <span className="font-medium">Alice Johnson</span>
              </div>
              <span>Tech Corp</span>
              <span>alice@techcorp.com</span>
              <span>+1 555 123 4567</span>
              <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition">
                <button className="text-[#0056B3] hover:text-[#004499] p-2 rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button className="text-[#DC3545] hover:text-[#C82333] p-2 rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Contacts;