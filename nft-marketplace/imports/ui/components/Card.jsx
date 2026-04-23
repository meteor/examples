import React from "react";
import { useNavigate } from "react-router-dom";
import { RoutePaths } from "../common/RoutePaths";

export const Card = ({
  children,
  className = '',
  itemImg = null,
  itemName = null,
  itemPrice = null,
  itemId = null,
  badge = '',
}) => {
  const navigate = useNavigate();
  const badgeBackgroundColor = (badge === "owned") ? "bg-burst" : "bg-dodger";

  return (
    <div className={`cursor-pointer ${className}`} onClick={() => navigate(`${RoutePaths.DETAILS}/${itemId}`)}>
      <div className="relative rounded-t-lg max-h-80 flex items-center overflow-hidden">
        {badge && (
          <p className={`absolute top-0 left-0 text-small text-white font-medium uppercase rounded-br-lg py-1 px-2 ${badgeBackgroundColor}`}>{badge}</p>
        )}
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
