import React from "react";

export const Card = ({
  children,
  className = '',
  itemImg = null,
  itemName = null,
  itemPrice = null,
  itemId = null,
}) => {
  return (
    <div className={`${className}`}>
      <div className="rounded-t-xl max-h-80 flex items-center overflow-hidden">
        <img className="w-full" src={itemImg} />
      </div>
      <div className="rounded-b-xl bg-white p-4">
        <div className="flex justify-between items-start">
          <p className="text-p text-rhino">{itemName}</p>
          <p className="text-p text-rhino">{itemPrice} ETH</p>
        </div>
        <p className="text-p text-manatee">#{itemId}</p>
      </div>
    </div>
  );
}
