
# Adonis 5 Nats Broker
**AdonisJS** is a Node.js framework, and hence it requires Node.js to be installed on your computer. To be precise, we need at least the latest release of **Node.js v14**.
> Adonis, microservices, nats , messageBroker


## REST to NATS Proxy
The [REST to NATS](https://nats.io/blog/natsproxy_project/) proxy project [sohlich/nats-proxy](https://gopkg.in/sohlich/nats-proxy.v1) is the micro framework that provides a bridge between HTTP and NATS. To introduce the problem, we first compare the HTTP and NATS communication models. The table below represents the matching of HTTP and NATS concepts and what do they provide.


## Table of contents

- [adonis5-nats-broker](#adonis5-nats-broker)
- [Installation](#installation)
- [Configuration](#configuration)
- [Exception handling](#exception-handling)
  - [Handling exceptions globally](#handling-exceptions-globally)
  - [Custom exceptions](#custom-exceptions)
- [Controllers](#controllers)
  - [Applying middleware](#applying-middleware)
  - [Controllers location](#controllers-location)
  - [Creating Controllers](#creating-controllers)
- [Middleware](#middleware)
  - [Basic Example](#basic-example)
  - [Middleware classes](#middleware-classes)
  - [About middleware class](#about-middleware-class)
  - [Registering middleware](#registering-middleware)
    - [Global middleware](#global-middleware)
    - [Named middleware](#named-middleware)
      - [Passing config to named middleware](#passing-config-to-named-middleware)
  - [Testing](#testing)
    - [Configuring](#configuring)



## Installation
You can install the adonis5-nats-broker package using npm:

```bash  
npm i adonis5-nats-broker  
```  
Additionally, you can set up a NATS server using Docker:

```yaml  
version: '3.7'  
services:  
nats:  
image: 'nats'  
ports:  
- '4222:4222'  
```
Start the NATS server with:

```bash  
docker-compose up nats  
```  
## Configuration
Initialize and configure the adonis5-nats-broker package:

```bash  
node ace configure adonis5-nats-broker  
node ace init:nats:handler  
```  

## Exception handling
AdonisJS uses exceptions for flow control instead of excessive conditionals. Exception handling can be done globally and with custom exceptions.

```bash  
node ace init:nats:handler  

# CREATE: app/Exceptions/Nats/Handler.ts  
```  
### Handling exceptions globally
Exceptions during NATS requests are handled by the global exception handler, typically located in app/Exceptions/Nats/Handler.ts. You can customize this handler to handle specific exceptions, such as validation failures.

```typescript  
import Logger from '@ioc:Adonis/Core/Logger'  
import NatsExceptionHandler from '@ioc:Adonis/Addons/NatsExceptionHandler'  
  
export default class ExceptionHandler extends NatsExceptionHandler {  
	constructor() {  
		super(Logger)  
	}  
  
	public async handle(error: any, ctx: NatsContextContract) {  
		/**  
		* Self handle the validation exception  
		*/  
		if (error.code === 'E_VALIDATION_FAILURE') {  
			return ctx.response.status(422).send(error.messages)  
		}  
		  
		/**  
		* Forward rest of the exceptions to the parent class  
		*/  
		return super.handle(error, ctx)  
	}  
		  
	public async report(error: any, ctx: NatsContextContract) {  
		if (!this.shouldReport(error)) {  
			return  
		}  
		  
		if (typeof error.report === 'function') {  
			error.report(error, ctx)  
			return  
		}  
		  
		someReportingService.report(error.message)  
	}  
}  
```  
### Custom exceptions
You can create custom exceptions using the node ace make:nats:exception command. These exceptions can be raised in your code to handle specific error cases. You can customize the handling and reporting of these exceptions as needed.


```bash  
node ace make:nats:exception UnAuthorized  

# CREATE: app/Exceptions/Nats/UnAuthorizedException.ts  
```  
Next, import and raise the exception as follows.
```typescript  
import UnAuthorized from 'App/Exceptions/Nats/UnAuthorizedException'  
  
const message = 'You are not authorized'  
const status = 403  
const errorCode = 'E_UNAUTHORIZED'  
  
throw new UnAuthorized(message, status, errorCode)  
  
```  
You can self-handle this exception by implementing the handle method on the exception class.

```typescript  
import { Exception } from '@adonisjs/core/build/standalone'  
import { NatsContextContract } from '@ioc:Adonis/Addons/NatsContext'  
  
export default class UnAuthorizedException extends Exception {  
	public async handle(error: this, ctx: NatsContextContract) {  
		ctx.response.status(error.status).send(error.message)  
	}  
}  
// app/Exceptions/Nats/UnAuthorizedException.ts  
  
```  
Optionally, implement the report method to report the exception to a logging or error reporting service.

```typescript  
import { Exception } from '@adonisjs/core/build/standalone'  
import { NatsContextContract } from '@ioc:Adonis/Addons/NatsContext'  
  
export default class UnAuthorizedException extends Exception {  
	public report(error: this, ctx: NatsContextContract) {  
		reportingService.report(error.message)  
	}  
}  
// app/Exceptions/Nats/UnAuthorizedException.ts  
  
```  
## Controllers
Controllers are essential for handling NATS requests in AdonisJS. They help organize route handling logic.

```typescript  
import { NatsContextContract } from '@ioc:Adonis/Addons/NatsContext'  
  
export default class PostsController {  
	public async index(ctx: NatsContextContract) {  
	return [  
			{ id: 1, title: 'Hello world'},  
			{ id: 2, title: 'Hello universe'},  
		]  
	}  
}  
```  
You will have to reference it as a route handler inside the ***start/broker.ts*** file to use this controller.
```typescript  
Broker.route('get.posts', 'PostsController.index')  
```  
### Applying middleware
Middleware can be applied to routes using the .middleware method. Middleware functions execute before the route handler. You can enable and disable middleware for specific routes.

```typescript  
Broker.middleware('userAuth')  
Broker.route('get.posts', 'PostsController.index')  
Broker.middleware()  
```  


### Controllers location
By convention, controllers are stored in the app/Controllers/Nats directory, but their location can be configured in the config/nats.ts file.

```json  
{  
	"namespaces": {  
		"controllers": "App/Controllers/Nats"  
	}  
}  
```  
### Creating Controllers
You can generate controllers using the node ace make:nats:controller command.

```bash  
node ace make:nats:controller Post  

# CREATE: app/Controllers/Nats/UserController.ts  
```  
## Middleware
Middleware functions are executed before route handlers and can modify requests or responses.


### Basic example
You can attach middleware to routes using Broker.middleware. Middleware functions can be simple inline functions.

```typescript  
// Enabling middleware for below routes  
Broker.middleware('userAuth')  
  
Broker.route('get.users', 'UsersController.index')  
Broker.route('post.users', 'UsersController.store')  
Broker.route('put.users.{id}', 'UsersController.update')  
Broker.route('get.users.{id}', 'UsersController.detail')  
Broker.route('delete.users.{id}', 'UsersController.delete')  
  
// Disabling middleware for any routes after below middleware  
Broker.middleware()  
```  
### Middleware classes
It's recommended to create middleware as classes to keep your code organized. Middleware classes are stored in the app/Middleware/Nats directory. Each class must implement the handle method.

```bash  
node ace make:nats:middleware LogRequest  
  
// CREATE: app/Middleware/LogRequest.ts  
  
```  
### Registering middleware
For the middleware to take effect, it must be registered as a global middleware or a named middleware inside the ***start/kernel.ts*** file.

#### Global middleware
Global middleware are executed for all the NATS requests in the same sequence as they are registered.

You register them as an array inside the ***start/kernel.ts*** file, as shown below:
```typescript  
Server.middleware.register([  
	() => import('App/Middleware/Nats/LogRequest')  
])  
```  
#### Named middleware
Named middleware allows you to selectively apply middleware on your routes. You begin by registering them with a unique name and later reference it on the route by that name.
```typescript  
Server.middleware.registerNamed({  
	auth: () => import('App/Middleware/Nats/Auth')  
})  
```  
##### Passing config to named middleware
Named middleware can also accept runtime config through the handle method as the third argument. For example:
```typescript  
export default class Auth {  
	public async handle({ request, response }: NatsContextContract, next: () => Promise<void>, guards?: string[]) {  
		console.log(guards)  
	}  
}  
```  
In the above example, the Auth middleware accepts an optional guards array. The user of the middleware can pass the guards as follows:

```typescript  
import Broker from "./Broker";  
  
Broker.middleware('auth:web,api')  
Broker.route('get.profile', 'UserController.profile')  
  
```  

## Testing
AdonisJS has out of the box support for testing, and there is no need to install any third-party packages for the same. Just run the  `node ace test`  and the magic will happen.

### Configuring
Register Nats test plugin in to array inside the ***tests/bootstrap.ts*** file, as shown below:

```typescript  
import {natsClient} from 'adonis5-nats-broker/build/src/test'  
import Broker from '@ioc:Adonis/Addons/NatsBroker'  
  
export const plugins: Required<Config>['plugins'] = [  
	assert(),  
	runFailedTests(),  
	apiClient(),  
	natsClient(Broker),  
]  
```  
The primary use case for the NATS client is to test JSON responses. However, there are no technical limitations around other response types like HTML, or even plain text.

```typescript  
import {test} from '@japa/runner'  
  
test.group('Users', () => {  
	test('get users', async ({ broker }) => {  
		const response = await broker.request('get.users', {}, { qs:{}, headers:{} })  
		response.assertStatus(200)  
		response.assertBodyContains([])  
	})  
})  
```

## Example usage
Here's an example of how to use adonis5-nats-broker in your AdonisJS application:

### start/broker.ts:
In this file, you can configure routes and middleware for NATS handling:

```typescript  
import Broker from '@ioc:Adonis/Addons/NatsBroker'

Broker.middleware("auth") // Enable middleware for specific routes
Broker.route('get.users', 'UsersController.index')
Broker.middleware() // Disable auth middleware

// Route without named middleware
Broker.route('get.countries', 'CountriesController.index')
  
```  

### app/Controllers/Nats/UserController.ts:
A sample controller handling NATS requests:

```typescript  
import type {NatsContextContract} from '@ioc:Adonis/Addons/NatsContext'  
import {schema} from "@ioc:Adonis/Core/Validator";  
import UpdateUserValidator from 'App/Validators/UpdateUserValidator'
  
export default class UserController {  
	public async index({response}: NatsContextContract) {  
		return response.ok([])  
	}  
	
	public async store({ request, response }: HttpContextContract) { 
		 const userSchema = schema.create({  
			first_name: schema.string({}, [rules.minLength(5), rules.maxLength(30)]),  
			last_name: schema.string({}, [rules.minLength(5), rules.maxLength(50)]),  
		})
		/** Validate request body against the schema */  
		const payload: any = await request.validate({schema:userSchema })
		/** store new user in database */  
		const user: User = await User.create(payload) 
		return response.created({  
			message: 'The user was successfully created',  
			data: user,  
		})  
	}
	
	public async update({ request, response }: HttpContextContract) { 
			/** Validate request body against the schema */  
			const payload: any = await request.validate(UpdateUserValidator)  
			/** store new user in database */  
			const user: User = await User.create(payload) 
			return response.created({  
				message: 'The user was successfully created',  
				data: user,  
			})  
	}
}  
```  
### App/Middleware/Nats/Auth.ts:
Sample middleware for authentication:


```typescript  
import type {NatsContextContract} from '@ioc:Adonis/Addons/NatsContext'  
  
export default class Auth {  
	public async handle({request, response}: NatsContextContract) {  
		// code for middleware goes here. ABOVE THE NEXT CALL  
		if (!request.header('authorization'))  
		return response.unauthorized({message: "authorization token is required"})  
		request.set('user', { name: 'jon', family: 'doe'})
	}  
}  
```
