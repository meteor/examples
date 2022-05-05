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
      <div className="rounded-b-xl p-2">
        <div className="flex justify-between items-start">
          <p>{itemName}</p>
          <p>{itemPrice}</p>
        </div>
        <p>{itemId}</p>
      </div>
    </div>
  );
}
