import React from 'react';

const PageTemplate = ({ title, children }) => {
  return (
    <div className="px-6 py-2">
      <h1 className="text-2xl font-bold mb-6">{title}</h1>
      {children || (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500">Content for {title} will be added soon.</p>
        </div>
      )}
    </div>
  );
};

export default PageTemplate;