import { Controller, Get, Post, Param, Body } from '@nestjs/common';

@Controller('dummy')
export class DummyController {
  @Get()
  getUsers() {
    return {
      message: 'Getting all users',
    };
  }

  @Get(':id')
  getUserById(@Param('id') id: string) {
    return {
      message: `Getting user ${id}`,
    };
  }

  @Post()
  createUser(@Body() body: any) {
    return {
      message: 'User created',
      data: body,
    };
  }
}
