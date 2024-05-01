import Link from 'next/link'
import SidebarDrawer from './SideDrawer'
import React, { Fragment, useState } from 'react'
import InputBox from './Inputbox'
import CtaButton from './CtaButton'
import { IconButton } from '@mui/material'

const LoginForm = () => {
  const [isReg, setIsReg] = useState(false)

  const toggleFunction = () => {
    setIsReg(!isReg)
  }

  const [loginParams, setLoginParams] = useState({
    phone_or_email: '',
    password: '',
  })

  const handleLoginParmas = (e) => {
    let { name, value } = e.target
    setLoginParams({ ...loginParams, [name]: value })
  }

  const [params, setParams] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirm_password: '',
  })

  const handleParams = (e) => {
    let { name, value } = e.target
    setParams({ ...params, [name]: value })
  }

  const [show, setShow] = useState(false)

  return (
    <>
      {!isReg ? (
        <div className="p-10">
          <h1 className="lg:text-3xl text-2xl font-poppins font-medium text-footerDark tracking-wide">
            Login
          </h1>

          <p className="text-sm font-poppins text-gray-400 mt-2">
            or
            <span
              className="text-sm font-poppins text-swiggyOrange cursor-pointer"
              onClick={toggleFunction}
            >
              {' '}
              create an account
            </span>
          </p>

          <div className="w-7 border-b border-footerDark" />

          <div className="w-full flex flex-col gap-4 mt-5">
            <InputBox
              name="phone_or_email"
              label="Phone or Email"
              styles="w-full"
              value={loginParams.phone_or_email}
              onChange={handleLoginParmas}
            />

            <div className="relative w-full">
              <InputBox
                name={'password'}
                label={'Enter Password'}
                styles={'w-full'}
                type={!show ? 'password' : 'text'}
                value={loginParams.password}
                onChange={handleLoginParmas}
              />

              <div
                onClick={() => setShow(!show)}
                className="absolute top-5 right-5 cursor-pointer"
              >
                {!show ? (
                  <img
                    src="/icons/eyeOpen.svg"
                    alt="eyeOpen"
                    className="w-5 h-5"
                  />
                ) : (
                  <img
                    src="/icons/eyeClose.svg"
                    alt="eyeClose"
                    className="w-5 h-5"
                  />
                )}
              </div>
            </div>

            <Link href="/dashboard">
              <CtaButton>Login</CtaButton>
            </Link>
          </div>

          <p className="text-sm font-poppins text-footerDark mt-2">
            If your a registered store owner. Click{' '}
            <Link href="/dashboard/login">
              <span className="text-sm font-poppins text-swiggyOrange cursor-pointer hover:underline">
                here
              </span>
            </Link>
          </p>
        </div>
      ) : (
        <div className="p-10">
          <h1 className="lg:text-3xl text-2xl font-poppins font-medium text-footerDark tracking-wide">
            Register User
          </h1>

          <p className="text-sm font-poppins text-gray-400 mt-2">
            or already a user?
            <span
              className="text-sm font-poppins text-swiggyOrange cursor-pointer"
              onClick={toggleFunction}
            >
              {' '}
              Click here
            </span>
          </p>

          <div className="w-7 border-b border-footerDark" />

          <div className="w-full flex flex-col gap-4 mt-5">
            <InputBox
              name="name"
              label="Name"
              styles="w-full"
              value={params.name}
              onChange={handleParams}
            />

            <InputBox
              name="phone"
              label="Phone"
              styles="w-full"
              value={params.phone}
              onChange={handleParams}
            />

            <InputBox
              name="email"
              label="Email"
              styles="w-full"
              value={params.email}
              onChange={handleParams}
            />

            <div className="relative w-full">
              <InputBox
                name={'password'}
                label={'Password'}
                styles={'w-full'}
                type={!show ? 'password' : 'text'}
                value={params.password}
                onChange={handleParams}
              />

              <div
                onClick={() => setShow(!show)}
                className="absolute top-5 right-5 cursor-pointer"
              >
                {!show ? (
                  <img
                    src="/icons/eyeOpen.svg"
                    alt="eyeOpen"
                    className="w-5 h-5"
                  />
                ) : (
                  <img
                    src="/icons/eyeClose.svg"
                    alt="eyeClose"
                    className="w-5 h-5"
                  />
                )}
              </div>
            </div>

            <div className="relative w-full">
              <InputBox
                name={'confirm_password'}
                label={'Confirm Password'}
                styles={'w-full'}
                type={!show ? 'password' : 'text'}
                value={params.confirm_password}
                onChange={handleParams}
              />

              <div
                onClick={() => setShow(!show)}
                className="absolute top-5 right-5 cursor-pointer"
              >
                {!show ? (
                  <img
                    src="/icons/eyeOpen.svg"
                    alt="eyeOpen"
                    className="w-5 h-5"
                  />
                ) : (
                  <img
                    src="/icons/eyeClose.svg"
                    alt="eyeClose"
                    className="w-5 h-5"
                  />
                )}
              </div>
            </div>

            <CtaButton>Register</CtaButton>
          </div>

          <p className="text-sm font-poppins text-footerDark mt-2">
            If your a registered store owner. Click{' '}
            <Link href="/dashboard/login">
              <span className="text-sm font-poppins text-swiggyOrange cursor-pointer hover:underline">
                here
              </span>
            </Link>
          </p>
        </div>
      )}
    </>
  )
}

const DetectLocation = () => {
  return (
    <div className="p-10">
      <div className="w-full flex flex-col gap-4 mt-5">
        <input
          className="p-3 w-full border border-gray-400 outline-none font-poppins text-sm"
          placeholder="Search for area, street name.."
        />

        <div className="w-full p-7 border border-gray-400 group flex items-start gap-3">
          <img src="/icons/location.svg" alt="crosshair" className="w-6 h-6" />

          <div>
            <p className="group-hover:text-swiggyOrange text-sm font-poppins font-medium text-footerDark">
              Get current location
            </p>

            <p className="text-sm font-poppins text-[#808080]">Using GPS</p>
          </div>
        </div>
      </div>
    </div>
  )
}

const Header = () => {
  const pageLinks = [
    {
      name: 'search',
      link: '#',
      onClick: () => {},
    },
    {
      name: 'offers',
      link: '#',
      onClick: () => {},
    },
    {
      name: 'help',
      link: '#',
      onClick: () => {},
    },
    {
      name: 'sign in',
      link: '#',
      onClick: () => signinOpen(),
    },
    {
      name: 'cart',
      link: '/cart',
      onClick: () => {},
    },
  ]

  const [signin, setsignin] = useState(false)

  const signinOpen = () => {
    setsignin(true)
  }

  const signInClose = () => {
    setsignin(false)
  }

  const [locationDrawer, setLocationDrawer] = useState(false)

  const locationDrawerOpen = () => {
    setLocationDrawer(true)
  }

  const locationDrawerClose = () => {
    setLocationDrawer(false)
  }

  return (
    <Fragment>
      <div className="w-full p-5 bg-white shadow">
        <div className="lg:w-[1290px] m-auto flex lg:flex-row items-center justify-between">
          {/* Brand Logo & Location */}
          <div className="flex items-center lg:gap-10">
            <Link href="/">
              <img
                src="/icons/swiggyLogo.svg"
                alt="swiggyLogo"
                className="h-12 w-12 hover:scale-[1.1] transition-all cursor-pointer"
              />
            </Link>

            <div
              onClick={locationDrawerOpen}
              className="lg:flex hidden flex-row items-start gap-2 group cursor-pointer"
            >
              <p className="text-sm group-hover:text-swiggyOrange text-footerDark font-poppins font-medium tracking-wide border-b-2 border-footerDark group-hover:border-swiggyOrange">
                Whitefield
              </p>
              <p className="font-poppins text-sm text-[#808080] group-hover:opacity-50 font-medium tracking-wide">
                Bengaluru, Karnataka, India
              </p>
            </div>
          </div>

          {/* Menu Items */}

          <div className="lg:flex hidden items-center lg:gap-10 gap-7 lg:flex-row">
            {React.Children.toArray(
              pageLinks.map((item) => (
                <Link href={item.link}>
                  <p
                    onClick={item.onClick}
                    className="capitalize cursor-pointer text-footerDark opacity-80 hover:opacity-100 hover:text-swiggyOrange font-poppins font-medium text-base tracking-wide"
                  >
                    {item.name}
                  </p>
                </Link>
              )),
            )}
          </div>

          <div className="lg:hidden block">
            <IconButton>
              <img
                src="/icons/burgerMenu.svg"
                alt="burger_menu"
                className="w-7 h-7 cursor-pointer"
              />
            </IconButton>
          </div>
        </div>
      </div>

      <SidebarDrawer
        anchor="right"
        open={signin}
        handleClose={signInClose}
        renderComponent={<LoginForm />}
      />

      <SidebarDrawer
        anchor="left"
        open={locationDrawer}
        handleClose={locationDrawerClose}
        renderComponent={<DetectLocation />}
      />
    </Fragment>
  )
}

export default Header
