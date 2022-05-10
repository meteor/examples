import React from 'react';
import { Link } from "react-router-dom";
import { RoutePaths } from "./RoutePaths";
import { Disclosure } from '@headlessui/react';
import { MenuIcon, XIcon } from '@heroicons/react/outline';

const navigation = [
  { name: 'Explore', href: RoutePaths.ROOT },
  { name: 'Create', href: RoutePaths.SELL_NFT },
];

export const NavBar = ({ connection }) => {
  return (
    <Disclosure as="nav" className="bg-violet text-white py-2.5">
      {({ open }) => (
        <>
          <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
            <div className="relative flex items-center justify-between h-16">
              <div className="flex-1 flex items-center justify-between sm:items-stretch">
                <div className="flex-shrink-0 flex items-center">
                  <Link to={RoutePaths.ROOT}><img src="images/logo.png" alt="Meteor NFT"/></Link>
                </div>
                <div className="hidden sm:block sm:ml-6">
                  <div className="flex items-center space-x-4">
                    {navigation.map((item) => (
                      <Link className="px-3 py-2 rounded-md text-p font-medium" to={item.href} key={item.href}>
                        {item.name}
                      </Link>
                    ))}

                    <div className="border-l border-lilac opacity-50 h-9"></div>

                    {connection ? (
                      <Link className="px-3 py-2 rounded-md text-p font-medium" to={RoutePaths.CONNECT}>
                        Account
                      </Link>
                    ) : (
                      <Link className="px-3 py-2 rounded-md text-p font-medium" to={RoutePaths.CONNECT}>
                        Connect
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              <div className="absolute inset-y-0 right-0 flex items-center sm:hidden">
                {/* Mobile menu button */}
                <Disclosure.Button className="inline-flex items-center justify-center p-2 rounded-md border-2 border-charade">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XIcon className="block h-6 w-6 text-charade" aria-hidden="true" />
                  ) : (
                    <MenuIcon className="block h-6 w-6 text-charade" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          {/* Mobile menu items */}
          <Disclosure.Panel className="sm:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-charade">
              {navigation.map((item) => (
                <Disclosure.Button
                  key={item.href}
                  as={Link}
                  to={item.href}
                  className="block px-3 py-2 text-p font-medium"
                >
                  {item.name}
                </Disclosure.Button>
              ))}

              {connection ? (
                <Disclosure.Button
                  as={Link}
                  to={RoutePaths.CONNECT}
                  className="block px-3 py-2 text-p font-medium"
                >
                  Account
                </Disclosure.Button>
              ) : (
                <Disclosure.Button
                  as={Link}
                  to={RoutePaths.CONNECT}
                  className="block px-3 py-2 text-p font-medium"
                >
                  Connect
                </Disclosure.Button>
              )}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  )
}
