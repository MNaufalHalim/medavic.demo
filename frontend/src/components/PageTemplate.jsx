import React from 'react';

const PageTemplate = ({ title, children }) => {
  return (
    <div className="">
      {children || (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500">Content for {title} will be added soon.</p>
        </div>
      )}
    </div>
  );
};

export default PageTemplate;