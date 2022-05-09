import React from 'react';
import { Link } from "react-router-dom";
import { RoutePaths } from "./RoutePaths";
import { Disclosure } from '@headlessui/react'
import { MenuIcon, XIcon } from '@heroicons/react/outline'

const navigation = [
  { name: 'Sell NFT', href: RoutePaths.SELL_NFT },
  { name: 'Nav Link 2', href: '#1' },
  { name: 'Nav Link 3', href: '#2' },
];

export const NavBar = () => {
  return (
    <Disclosure as="nav" className="bg-white-lilac">
      {({ open }) => (
        <>
          <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
            <div className="relative flex items-center justify-between h-16">
              <div className="flex-1 flex items-center justify-between sm:items-stretch">
                <div className="flex-shrink-0 flex items-center">
                  <Link to={RoutePaths.ROOT}><h1>NFT Marketplace</h1></Link>
                </div>
                <div className="hidden sm:block sm:ml-6">
                  <div className="flex items-center space-x-4">
                    {navigation.map((item) => (
                      <Link className="px-3 py-2 rounded-md text-sm font-medium" to={item.href} key={item.href}>
                        {item.name}
                      </Link>
                    ))}
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
                  className="block px-3 py-2 rounded-md text-white-lilac font-medium hover:text-lavender focus:text-lavender"
                >
                  {item.name}
                </Disclosure.Button>
              ))}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  )
}
