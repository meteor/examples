import React from 'react';

/**
 * https://tailwindcomponents.com/component/dashboard-metrics-default
 */
export const Dashboard = () => {
  return (
    <div className="flex items-center bg-gray-50 dark:bg-gray-900">
      <div className="container max-w-6xl px-5 mx-auto my-28">
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
          <div className="p-5 bg-white rounded shadow-sm">
            <div className="text-base text-gray-400 ">Total Sales</div>
            <div className="flex items-center pt-1">
              <div className="text-2xl font-bold text-gray-900 ">$9850.90</div>
              <span
                className="flex items-center px-2 py-0.5 mx-2 text-sm text-green-600 bg-green-100 rounded-full">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18 15L12 9L6 15"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>
                </svg>
                <span>1.8%</span>
              </span>
            </div>
          </div>
          <div className="p-5 bg-white rounded shadow-sm">
            <div className="text-base text-gray-400 ">Net Revenue</div>
            <div className="flex items-center pt-1">
              <div className="text-2xl font-bold text-gray-900 ">$7520.50</div>
              <span
                className="flex items-center px-2 py-0.5 mx-2 text-sm text-red-600 bg-red-100 rounded-full">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6 9L12 15L18 9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>
                </svg>
                <span>2.5%</span>
              </span>
            </div>
          </div>
          <div className="p-5 bg-white rounded shadow-sm">
            <div className="text-base text-gray-400 ">Customers</div>
            <div className="flex items-center pt-1">
              <div className="text-2xl font-bold text-gray-900 ">1375</div>
              <span
                className="flex items-center px-2 py-0.5 mx-2 text-sm text-green-600 bg-green-100 rounded-full">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18 15L12 9L6 15"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>
                </svg>
                <span>5.2%</span>
              </span>
            </div>
          </div>
          <div className="p-5 bg-white rounded shadow-sm">
            <div className="text-base text-gray-400 ">MRR</div>
            <div className="flex items-center pt-1">
              <div className="text-2xl font-bold text-gray-900 ">$250.00</div>
              <span
                className="flex items-center px-2 py-0.5 mx-2 text-sm text-green-600 bg-green-100 rounded-full">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18 15L12 9L6 15"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>
                </svg>
                <span>2.2%</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
