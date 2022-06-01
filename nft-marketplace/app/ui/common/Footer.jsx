import React from 'react';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="w-full max-w-7xl mx-auto mt-14 px-2 sm:px-6 lg:px-8 ">
      <div className="border-t border-manatee/30 py-7 flex justify-between">
        <p className="text-p text-manatee">{`© 2018 - ${currentYear} Ozone Networks, Inc`}</p>

        <div className="flex">
          <a href="#" className="text-dodger">Privacy Policy</a>
          <span className="text-manatee mx-2">|</span>
          <a href="#" className="text-dodger">Terms of Service</a>
        </div>
      </div>
    </div>
  )
}
