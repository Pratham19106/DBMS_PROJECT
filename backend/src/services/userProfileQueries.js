const getAllUserProfilesQuery = `
  select * from profiles
`

const getUserProfileQuery = `
  select * from profiles
  where user_id = $1
`

const addUserProfileQuery = `
  Insert into profiles(user_id , business_name , phone_number , address)
  values($1 , $2 , $3 , $4)
  returning *
`

const updateUserProfileQuery = `
  update profiles
  set business_name  = $1 , phone_number = $2 , address = $3
  where user_id = $4
  returning *
`

module.exports = {getAllUserProfilesQuery , getUserProfileQuery ,addUserProfileQuery , updateUserProfileQuery}