const getUserQuery = `
   select *
   from users
   where id = $1
`
const getALLUsersQuery = `
 select *
 from users
`
const addNewUserQuery = `
 insert into users(name , email , password)
 values($1 , $2 , $3)
 returning *
`
const deleteUserQuery = `
 delete from users
 where id = $1
 returning *
`

const updateUserQuery = `
update users
set name = $1 , email = $2 , password = $3
where id = $4
returning id , name , email
`
module.exports = {getUserQuery , getALLUsersQuery , addNewUserQuery , deleteUserQuery , updateUserQuery}